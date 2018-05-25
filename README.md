# kscli

[![NPM Version](https://img.shields.io/npm/v/@carlos22ivan/kscli.svg)](https://www.npmjs.com/package/@carlos22ivan/kscli)

## como funciona?

kscli busca en los folders seleccionados los archivos de extencion ".yaml" con la etiqueta "kind" solicitadas, luego ejecuta la orden de despligue para k8s.

## Requisitos 

* j2  (python) link and quick install

## Installation

`$ npm i @carlos22ivan/kscli`

## How To Use

`$ kscli [path] -k [key,key,...] [options]`

* [path]

    |Ejemplo                            |value                       
    |:---:                              |:---:                      
    |. or ./                            |directorio actual| 
    |./dirname or ./dirname/            |especificando el directorio
    |./\*  or ./\*/                     |todos los directorios
    |./\*/dirname or ./\*/dirname/</pre>|todos las directorios con el directorio especificado

* [-k [key,key,...]]

    |key    |value                      
    |:---:  |:---:                      
    |srv    |Service                    
    |cfm    |ConfigMap                  
    |dep    |Deployment                 
    |hpa    |HorizontalPodAutoscaler    
    |ing    |Ingress                    
    |nsp    |Namespace                  

* [options]
    * -e [enviroment name]
    * -f [name,name,...]
    * -h (help)
    * -v (version)

## example

##### framework

 * cluster <-- aqui estamos
    * project a
        * folder 1
        * folder 2
            * service.yaml
            * horizontal.yaml
            * deployment.yaml
            * important.yaml
            * development.yaml
        * folder 3
    * projct b    
        * folder 1
        * folder 2
            * service.yaml
            * horizontal.yaml
            * deployment.yaml
            * development.yaml
            * development-test.yaml

##### ejemplo 1

##### ejemplo 2

## mejoras, a futuro

dejar de usar j2 por algo de js


kscli :3
