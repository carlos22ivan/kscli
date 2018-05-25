#!/usr/bin/env node

/**
 * dependencias
 **/
const program = require('commander')
const path = require('path')
const fs = require('fs')
const colors = require('colors')
const yaml = require('js-yaml');
const {exec, execSync, spawnSync} = require('child_process');

const kindsCommand = {
    srv: 'service',
    cfm: 'configmap',
    dep: 'deployment',
    hpa: 'horizontalpodautoscaler',
    ing: 'ingress',
    nsp: 'namespace'
}
let directorios = []

program
    .version('2.0.1')
    .arguments('[paths...]')
    .description('aqui deberia decir lo que hace :v')
    .option('-e, --env <env>', 'set enviroment filename, default is _development.yaml.')
    .option('-k, --kind <kinds>', 'set (srv -> service), is necessary or default is all?.')
    .option('-f, --file <files>', 'add static files.')
    .action((params) => directorios = params)
    .parse(process.argv)

/**
 * valida que exista un directorio seleccionado
 * valida que no sea el directorio raiz
 **/
if (!directorios.length) print('directory not found.', 'error')
directorios.forEach(directorio => {
    if (directorio.startsWith('/')) print('directory root is dennid.', 'error')
})

/**
 * valida que los globs sean solo directorios
 **/
let auxDirectorios = []
directorios.forEach((directorio, index, array) => {
    if (fs.lstatSync(directorio).isDirectory())
        auxDirectorios.push(directorio)
})
directorios = auxDirectorios

/**
 * valida que exista minimo un kind
 * crea un listado de kind requested
 * verifica que los kind sean validos
 * asigna el nombre del kind requested
 * verifica que exista minimo un kind requested
 **/
if (!program.kind) print('-k options is required.', 'error')
let kindsRequest = program.kind.split(',')
kindsRequest = kindsRequest.filter((kind) => {
    let msgWarning = `warning: the kind requested: "${kind}" is not valid kind.`
    if (!kindsCommand[kind]) print(msgWarning, 'yellow')
    return kindsCommand[kind]
})
kindsRequest.forEach((item, index, array) => {
    array[index] = kindsCommand[item]
})
if (!kindsRequest.length) print('kind requested not found.', 'error')

/**
 * lista los files candidatos name solicitados
 **/
let files = (program.file) ? program.file.split(',') : []

/**
 * sobrecarga el nombre del enviroment si es solicitado
 * elimina los directorios que no posean un enviroment file
 **/
let env = (program.env) ? program.env : '_development.yaml'
directorios = directorios.filter(directorio => {
    return existEnviromentFile(directorio)
})

/**
 * Inicializa un matriz para los archivos candidatos
 * recorre todos los directorios y agrega candidatos
 * crea un listado de candidatos
 **/
var matrizCandidatos = [];
for (let i = 0; i < kindsRequest.length + 1; ++i) matrizCandidatos[i] = [];
directorios.forEach((directorio) => {
    fs.readdirSync(directorio).forEach(filename => {
        if (!filename.endsWith('.yaml')) return
        if (!files.indexOf(filename)) matrizCandidatos[0].push(path.join(directorio, filename))
        let filekind = obtenerKindOfYamlFile(filename, directorio)
        if (filekind === undefined) return
        let kindsRequestIndex = kindsRequest.indexOf(filekind.toLowerCase())
        if (kindsRequestIndex < 0) return
        matrizCandidatos[kindsRequestIndex + 1].push(path.join(directorio, filename))
    })
})
let listaCandidatos = []
matrizCandidatos.forEach((value, index, array) => {
    matrizCandidatos[index].forEach(value => {
        listaCandidatos.push(value)
    })
})
recorrerListaCandidatos(listaCandidatos, 0)

/**
 * Funciones
 **/


/**
 * recorre la lista de candidatos de forma sincrona
 * invoca la ejecucion del commando de forma asincrona
 **/
async function recorrerListaCandidatos(array, index) {
    if (array.length === index) return
    await ejecutarCandidato(array[index], index)
    await recorrerListaCandidatos(array, index + 1)
}

/**
 * ejecuta la ejecucion del comando de forma asincrona
 **/
function ejecutarCandidato(value, index) {
    return new Promise((resolve) => {
        let commandLine = `j2 ${value} ${env} | kubectl apply -f -`
        // let commandLine = `ping -c 1 localhost`
        print(`kscli =^-^= [${index + 1}/${listaCandidatos.length}] => ${commandLine}`, 'magenta');
        let commandProcess = exec(commandLine)
        commandProcess.stdout.on('data', (data) => {
            print(data);
        });
        commandProcess.stderr.on('data', (data) => {
            print(data, 'red');
        });
        commandProcess.on('close', () => {
            resolve()
        });
    })
}

/**
 * valida que exista un env en el directorio
 **/
function existEnviromentFile(directorio) {
    if (!existFile(env, directorio)) {
        print(`warning: enviroment file [${env}] not found in folder ${directorio}`, 'yellow')
        return 0
    }
    return 1
}

/**
 * valida que un archivo exista en un directorio
 **/
function existFile(fileName, directorio) {
    if (!fs.existsSync(path.join(directorio, fileName))) return false
    return true
}

/**
 * imprime un mensaje y continua
 **/
function print(txt, color) {
    switch (color) {
        case 'yellow':
            console.log(txt.yellow);
            break
        case 'red':
            console.log(txt.red);
            break
        case 'blue':
            console.log(txt.blue);
            break
        case 'green':
            console.log(txt.green);
            break
        case 'magenta':
            console.log(txt.magenta);
            break
        case 'error':
            console.log(txt.red);
            process.exit(1);
            break
        default:
            console.log(txt);
    }
}

/**
 * lee el valor de la etiqueta kind de un archivo .yaml
 **/
function obtenerKindOfYamlFile(file, directory) {
    let yamlObject = yaml.safeLoad(fs.readFileSync(path.join(directory, file), 'utf8'));
    return yamlObject.kind;
}
