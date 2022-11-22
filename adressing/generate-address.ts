let existingIp : Map<string, IpData> = new Map();

let existingMac: Map<string, string[]> = new Map();

export function generateIpAddress(): string {
    let ipArray: number[] = [randomBetween(0,255), randomBetween(0,255), randomBetween(0,255), randomBetween(0,255)];
    let newIp: string = ipArray[0]+"."+ipArray[1]+"."+ipArray[2]+"."+ipArray[3];

    //get a new randomized IP address if the generated one exists
    while (existingIp.has(newIp)){
        let randomAgain = randomBetween(0,3);
        ipArray[randomAgain] = randomBetween(0,255);
        newIp = ipArray[0]+"."+ipArray[1]+"."+ipArray[2]+"."+ipArray[3];
    }
    //put new IP into existing array
    existingIp.set(newIp, new IpData(ipArray, [numTo8BitBinary(ipArray[0]), numTo8BitBinary(ipArray[1]), numTo8BitBinary(ipArray[2]), numTo8BitBinary(ipArray[3])]));
    console.log([numTo8BitBinary(ipArray[0]), numTo8BitBinary(ipArray[1]), numTo8BitBinary(ipArray[2]), numTo8BitBinary(ipArray[3])]);
    console.log(newIp);
    return newIp;
}

export function generateMacAddress(): string {
    let macArray: string[] = [randomHex(), randomHex(), randomHex(), randomHex(), randomHex(), randomHex()];
    let newMac: string = macArray[0]+":"+macArray[1]+":"+macArray[2]+":"+macArray[3]+":"+macArray[4]+":"+macArray[5];

    //get a new randomized MAC address if the generated one exists
    while (existingMac.has(newMac)){
        let randomAgain = randomBetween(0,5);
        macArray[randomAgain] = randomHex();
        newMac = macArray[0]+":"+macArray[1]+":"+macArray[2]+":"+macArray[3]+":"+macArray[4]+":"+macArray[5];
    }
    //put new MAC into existing array
    existingMac.set(newMac, macArray);
    return newMac;
}


let randomBetween = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

//random a heximal number of 2 digits
let randomHex = (): string => {
    let hexRef = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
    return hexRef[randomBetween(0,15)]+hexRef[randomBetween(0,15)];
}

export function calculateNetworkId(ips: string[]): string{
    let matrix: string[][] = [];
    ips.forEach(ip => {
        if(existingIp.has(ip)){
            matrix.push(existingIp.get(ip).ipBinary);
        }
    });

    let matches: [string, string, string, string] = ["", "", "", ""];

    let octet = 0;
    while(octet<4){
        let currentMatch = matrix[0][octet];

        for(let i=1; i<matrix.length; i++){
            let next = matrix[i][octet];
            currentMatch = getLongestMatch(currentMatch,next);
            
            //exist if no match found
            if(currentMatch==""){
                matches[octet]="";
                break;
            }
        }
        matches[octet]=currentMatch;

        //continue if more matches possible
        if(currentMatch.length==8){
            octet++;
        }
        else{
            break;
        }
    }

    let id = "";
    let count = 0;
    matches.forEach(octet => {
        if(octet!=undefined && octet!=""){
            count += octet.length;

            while(octet.length!=8){
                octet+="0";
            }
            id+=parseInt(octet, 2)+".";
        }
        else{
            id+="0.";
        }
    });

    id = id.slice(0, -1) + " /"+count;
    console.log("networkId: "+id);
    return id;
}

export function generateNewIpProvidedSubnetMask(oldIp: string, compoundId: string, submask: number): string{
    let decimalArray = compoundId.split(".");

    let binaryArray = [];
    decimalArray.forEach(octet => {
        let temp = parseInt(octet).toString(2);
        let result = temp;

        if (temp.length < 8) {
            while (result.length != 8) {
                result = result+"0";
            }
        }
        binaryArray.push(result);
    });

    let newIp = binaryArray.toString().slice(0, submask);
    while (newIp.length != 32) {
        newIp += randomBetween(0, 1);
    }
    
    let binaryNew = [newIp.slice(0, 8), newIp.slice(8, 16), newIp.slice(16, 24), newIp.slice(24, 32)];
    let decimalNew = [parseInt(binaryNew[0], 2), parseInt(binaryNew[1], 2), parseInt(binaryNew[2], 2), parseInt(binaryNew[3], 2)];
    let ip = decimalNew[0] + "." + decimalNew[1] + "." + decimalNew[2] + "." + decimalNew[3];


    console.log("oldIp: "+oldIp+"   "+existingIp.get(oldIp).ipBinary.toString());

    existingIp.delete(oldIp);
    existingIp.set(ip, new IpData(decimalNew, binaryNew));

    
    console.log("newIp: "+ip+"   "+existingIp.get(ip).ipBinary.toString());

    return ip;
}

let getLongestMatch = (first: string, second: string): string => {
    //second string should be 8 bits
    if(second.length!=8){
        return "";
    }
    let match: string = "";
    for(let i=0; i<8; i++){
        if(first.charAt(i)==second.charAt(i)){
            match+=first.charAt(i);
        }
        else{
            return match;
        }
    }
    return match;
}

let numTo8BitBinary = (num: number): string => {
    let binary = num.toString(2);
    let result = binary;

    if(binary.length<8){
        while(result.length!=8){
            result = "0"+result;
        }
    }
    return result;
}


class IpData {
    ipArray: number[];
    ipBinary: string[];

    constructor(ipArray: number[], ipBinary: string[]){
        this.ipArray = ipArray;
        this.ipBinary = ipBinary;
    }
}