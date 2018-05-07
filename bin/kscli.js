//dependencias
const program = require('commander')
const path = require('path')
const fs = require('fs')
const colors = require('colors')
const yaml = require('js-yaml');
const {execSync} = require('child_process');

//variables globales
let directorio = path.resolve(__dirname)
let filesToExec = []

//init
program
    .version('1.0')
    .arguments('[params...]')
    .description('aqui deberia decir lo que hace :v')
    .option('-p, --path <path>', 'set especific path, default is directory in which the currently executing script.')
    .option('-e, --env <env>', 'set enviroment file, default is _development.yaml.')
    .option('-s, --service', 'add Service files.')
    .option('-c, --configMap', 'add ConfigMap files.')
    .option('-d, --deployment', 'add Deployment files.')
    .option('-a, --horizontalPodAutoscaler', 'add HorizontalPodAutoscaler files.')
    .option('-i, --ingress', 'add Ingress files.')
    .option('-n, --namespace', 'add Namespace files.')
    .action((params) => filesToExec = params)
    .parse(process.argv)

/*
    PASOS DEL SCRIPT

    1: valida los campos
    2: determina los archivos a ejecutar
    3: ejecuta el script
 */

//<<<<<<<<<< 1: valida los datos >>>>>>>>>>//

//  sobrecarga el directorio si es necesario
if (program.path) directorio = program.path;

//  valida que los parametros existan y sean .yaml
if (filesToExec.length) validarFilesToExecExist(filesToExec)

//  valida que exista un enviroment file y sea .yaml
let env = validarEnviromentFile(program.env)


//<<<<<<<<<< 2: determina los archivos a ejecutar >>>>>>>>>>//

//  agrega los archivos segun las opciones ejecutadas
agregarDinamicFiles()


//<<<<<<<<<< 3: ejecuta el script >>>>>>>>>>//

// execute()

//<<<<<<<<<< FUNCIONES >>>>>>>>>>//

//valida el ambiente
function validarEnviromentFile(env) {
    let enviromentFileName = env ? env : '_development.yaml'
    if (!enviromentFileName.endsWith('.yaml')) close(`error: the enviroment ${env} not .yaml format`)
    if (!existeArchivo(enviromentFileName)) close('error: enviroment file not found in folder ' + directorio)
    return enviromentFileName
}

//valida los parametros
function validarFilesToExecExist(array) {
    array.forEach(file => {
        if (!existeArchivo(file)) close(`error: the file ${file} not found in ${directorio}`)
        if (!file.endsWith('.yaml')) close(`error: the file ${file} not .yaml format`)
    })
}

//valida que un archivo exista en el directorio
function existeArchivo(fileName) {
    if (!fs.existsSync(path.join(directorio, fileName))) return false
    return true
}

//termina la aplicacion
function close(txt) {
    console.log(txt.red);
    process.exit(1);
}

//agrega el listado de files al array
function agregarDinamicFiles() {

    //  lista los tipos disponibles
    let tiposDisponibles = crearArraySegunKind()
    //  si no hay tipos, abandona
    if (!tiposDisponibles.length) return

    //  listado de yaml candidatos en el directorio
    let candidatos = []

    //  son candidatos si terminan en .yaml y no estan agregados aun
    fs.readdirSync(directorio).forEach(file => {
        if (file.endsWith('.yaml') && filesToExec.indexOf(file) === -1) candidatos.push(file)
    })

    //  si no hay candidatos, abandona
    if (!candidatos.length) return

    //  visita cada candidato
    candidatos.forEach(candidato => {
        //  obtiene el kind del .yaml
        let kind = obtenerKindOfYamlFile(candidato)

        //  ¿no tiene la etiquta kind? NEXT
        if (kind === undefined) return

        //if el kind es un tipo disponible, lo agrega c:
        if (tiposDisponibles.indexOf(kind.toLowerCase()) > -1) filesToExec.push(candidato)
    })
}

//crea un array de los tipos pasados como opcion
function crearArraySegunKind() {
    let tipos = []
    if (program.service) tipos.push('service')
    if (program.configMap) tipos.push('configmap')
    if (program.deployment) tipos.push('deployment')
    if (program.horizontalPodAutoscaler) tipos.push('horizontalpodautoscaler')
    if (program.ingress) tipos.push('ingress')
    if (program.namespace) tipos.push('namespace')
    return tipos
}

//obtiene el valor de la etiqueta kind de un .yaml
function obtenerKindOfYamlFile(file) {
    let yamlObject = yaml.safeLoad(fs.readFileSync(path.join(directorio, file), 'utf8'));
    return yamlObject.kind;
}

//execute the mistery command
function execute() {

    if (!filesToExec.length) close('error: No selected file')

    for (let aux = 0; aux < filesToExec.length; ++aux) {
        let etiqueta = `${aux + 1}/${filesToExec.length}:`
        let command = `j2 ${filesToExec[aux]} ${env} | kubectl apply -f -`
        console.log(`${etiqueta} command: ${command}`)
        let stdout = execSync(command);
        console.log(`${etiqueta}: ${stdout.toString()}`)
    }
    console.log('success =^-^='.green)
}
