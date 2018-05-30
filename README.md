# kscli

##### Deploy K8s faster and easier: 3

[![NPM Version](https://img.shields.io/npm/v/@carlos22ivan/kscli.svg)](https://www.npmjs.com/package/@carlos22ivan/kscli)

## how does it work?

kscli searches the selected files for the extension files ".yaml" with the "type" tag requested, then executes the drop order for k8s.

## Requirements

* j2  (python)

* node version 8.11.2 or above

## Installation

`# npm i @carlos22ivan/kscli -g`

## How To Use

`$ kscli [path] -k [key,key,...] [options]`

* path

    |Ejemplo                            |value                       
    |:---:                              |:---:                      
    |. or ./                            |Current directory| 
    |./dirname or ./dirname/            |specify the directory
    |./\*  or ./\*/                     |all the directories of the path
    |./\*/dirname or ./\*/dirname/</pre>|all the directories of the path with specify the directory

* -k [key,key,...]

    |key    |value                      
    |:---:  |:---:                      
    |srv    |Service                    
    |cfm    |ConfigMap                  
    |dep    |Deployment                 
    |hpa    |HorizontalPodAutoscaler    
    |ing    |Ingress                    
    |nsp    |Namespace                  

* options
    * -e [enviroment name] (default -> development.yaml)
    * -f [name,name,...]
    * -h (help)
    * -v (version)

## Example

##### framework

 * cluster <-- here we are
    * project-a
        * folder-1
        * folder-2
            * service.yaml
            * horizontal.yaml
            * deployment.yaml
            * important.yaml
            * development.yaml
        * folder 3
    * project-b    
        * folder-1
        * folder-2
            * service.yaml
            * other-service.yaml
            * horizontal.yaml
            * deployment.yaml
            * development.yaml
            * development-test.yaml

##### example
    
   * deploy other-service.yaml with development.yaml
    
        `$ kscli ./project-b/folder-2/ -f other-service.yaml`

   * deploy other-service.yaml with development-test.yaml
    
        `$ kscli ./project-b/folder-2/ -f other-service.yaml -e development-test.yaml`
    
   * deploy other-service.yaml and service.yaml with development.yaml
   
        `$ kscli ./project-b/folder-2/ -f other-service.yaml,service.yaml`
   
   * deploy all the services files in project-a
   
        `$ kscli ./project-a/*/ -k srv`
   
   * deploy all the services files in two projects

        `$ kscli ./*/*/ -k srv` or `$ kscli ./*/folder-2/ -k srv`
        
   * deploy all the service and configMap files in project-a
        
        `$ kscli ./project-a/*/ -k srv,cfm`
        
   * deploy other-service.yaml and all the service and configMap files in project-b
        
        `$ kscli ./project-a/*/ -f other-service.yaml -k srv,cfm`
        
   * deploy all the service and configMap files in project-b with development-test.yaml
        
        `$ kscli ./project-a/*/ -k srv,cfm -e development-test.yaml`
        
## Improvements, a future

stop using j2 (python) for some dependency of js


