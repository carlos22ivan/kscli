#!/usr/bin/env node
'use strict';

/**
 * Funciones
 **/

/**
 * recorre la lista de candidatos de forma sincrona
 * invoca la ejecucion del commando de forma asincrona
 **/
let recorrerListaCandidatos = (() => {
    var _ref = _asyncToGenerator(function* (candidatos, directorios, index) {
        if (candidatos.length === index) return;
        yield ejecutarCandidato(candidatos[index], directorios[index], index);
        yield recorrerListaCandidatos(candidatos, directorios, index + 1);
    });

    return function recorrerListaCandidatos(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
    };
})();

/**
 * ejecuta la ejecucion del comando de forma asincrona
 **/


function _asyncToGenerator(fn) {
    return function () {
        var gen = fn.apply(this, arguments);
        return new Promise(function (resolve, reject) {
            function step(key, arg) {
                try {
                    var info = gen[key](arg);
                    var value = info.value;
                } catch (error) {
                    reject(error);
                    return;
                }
                if (info.done) {
                    resolve(value);
                } else {
                    return Promise.resolve(value).then(function (value) {
                        step("next", value);
                    }, function (err) {
                        step("throw", err);
                    });
                }
            }

            return step("next");
        });
    };
}

/**
 * dependencias
 **/
const program = require('commander');
const path = require('path');
const fs = require('fs');
const colors = require('colors');
const yaml = require('js-yaml');
const {exec, execSync, spawnSync} = require('child_process');

const kindsCommand = {
    srv: 'service',
    cfm: 'configmap',
    dep: 'deployment',
    hpa: 'horizontalpodautoscaler',
    ing: 'ingress',
    nsp: 'namespace'
};
let directorios = [];

program.version('2.0.5').arguments('[paths...]').description('kscli searches the selected files for the extension files ".yaml" with the "type" tag requested, then executes the drop order for k8s.').option('-e, --env <env>', 'set enviroment filename, default is _development.yaml.').option('-k, --kind <kinds>', 'set kinds: srv -> Service, cfm -> ConfigMap, dep -> Deployment, hpa -> HorizontalPodAutoscaler, ing -> Ingress, nsp -> Namespace').option('-f, --file <files>', 'add static files.').action(params => directorios = params).parse(process.argv);

/**
 * valida que exista un directorio seleccionado
 * valida que no sea el directorio raiz
 **/
if (!directorios.length) print('directory not found.', 'error');
directorios.forEach(directorio => {
    if (directorio.startsWith('/')) print('directory root is dennid.', 'error');
});

/**
 * valida que los globs sean solo directorios
 **/
let auxDirectorios = [];
directorios.forEach((directorio, index, array) => {
    try {
        if (fs.lstatSync(directorio).isDirectory()) auxDirectorios.push(directorio);
    } catch (err) {
        let msgWarning = `warning: the folder : "${directorio}" not exist.`;
        print(msgWarning, 'yellow');
    }
});
directorios = auxDirectorios;

/**
 * si existe un kind
 * crea un listado de kind requested
 * verifica que los kind sean validos
 * asigna el nombre del kind requested
 * verifica que exista minimo un kind requested
 **/
let kindsRequest = [];
if (program.kind) {
    kindsRequest = program.kind.split(',');
    kindsRequest = kindsRequest.filter(kind => {
        let msgWarning = `warning: the kind requested: "${kind}" is not valid kind.`;
        if (!kindsCommand[kind]) print(msgWarning, 'yellow');
        return kindsCommand[kind];
    });
    kindsRequest.forEach((item, index, array) => {
        array[index] = kindsCommand[item];
    });
    if (!kindsRequest.length) print('kind requested not found.', 'error');
} else print('-k options is required.', 'error');
/**
 * lista los files candidatos name solicitados
 **/
let files = program.file ? program.file.split(',') : [];

/**
 * sobrecarga el nombre del enviroment si es solicitado
 * elimina los directorios que no posean un enviroment file
 **/
let env = program.env ? program.env : '_development.yaml';
directorios = directorios.filter(directorio => {
    return existEnviromentFile(directorio);
});

/**
 * Inicializa un matriz para los archivos candidatos
 * recorre todos los directorios y agrega candidatos
 * crea un listado de candidatos
 **/
let matrizCandidatos = [];
let listaDirectorios = [];
for (let i = 0; i < kindsRequest.length + 1; ++i) matrizCandidatos[i] = [];
directorios.forEach(directorio => {
    fs.readdirSync(directorio).forEach(filename => {
        if (!filename.endsWith('.yaml')) return;
        if (files.indexOf(filename) > -1) matrizCandidatos[0].push(path.join(directorio, filename));
        let filekind = obtenerKindOfYamlFile(filename, directorio);
        if (filekind === undefined) return;
        let kindsRequestIndex = kindsRequest.indexOf(filekind.toLowerCase());
        if (kindsRequestIndex < 0) return;
        matrizCandidatos[kindsRequestIndex + 1].push(path.join(directorio, filename));
        listaDirectorios.push(directorio);
    });
});
let listaCandidatos = [];
matrizCandidatos.forEach((value, index, array) => {
    matrizCandidatos[index].forEach(value => {
        listaCandidatos.push(value);
    });
});
if (listaCandidatos.length) recorrerListaCandidatos(listaCandidatos, listaDirectorios, 0); else print('warning: no file complies with the conditions', 'yellow');

function ejecutarCandidato(value, directorio, index) {
    return new Promise(resolve => {
        let commandLine = `j2 ${value} ${path.join(directorio, env)} | kubectl apply -f -`;
        // let commandLine = `ping -c 1 localhost`
        print(`kscli =^-^= [${index + 1}/${listaCandidatos.length}] => ${commandLine}`, 'magenta');
        let commandProcess = exec(commandLine);
        commandProcess.stdout.on('data', data => {
            print(data);
        });
        commandProcess.stderr.on('data', data => {
            print(data, 'red');
        });
        commandProcess.on('close', () => {
            resolve();
        });
    });
}

/**
 * valida que exista un env en el directorio
 **/
function existEnviromentFile(directorio) {
    if (!existFile(env, directorio)) {
        print(`warning: enviroment file [${env}] not found in folder ${directorio}`, 'yellow');
        return 0;
    }
    return 1;
}

/**
 * valida que un archivo exista en un directorio
 **/
function existFile(fileName, directorio) {
    if (!fs.existsSync(path.join(directorio, fileName))) return false;
    return true;
}

/**
 * imprime un mensaje y continua
 **/
function print(txt, color) {
    switch (color) {
        case 'yellow':
            console.log(txt.yellow);
            break;
        case 'red':
            console.log(txt.red);
            break;
        case 'blue':
            console.log(txt.blue);
            break;
        case 'green':
            console.log(txt.green);
            break;
        case 'magenta':
            console.log(txt.magenta);
            break;
        case 'error':
            console.log(txt.red);
            process.exit(1);
            break;
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
