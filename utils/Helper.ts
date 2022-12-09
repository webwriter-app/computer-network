export class AddressingHelper{
    static numTo8BitBinary(num: number): string {
        if(num==undefined || num==0){
            return "00000000";
        }
        let binary = num.toString(2);
        let result = binary;
    
        if (binary.length < 8) {
            while (result.length != 8) {
                result = "0" + result;
            }
        }
        return result;
    }


    static getLongestMatch(first: string, second: string): string {
        //second string should be 8 bits
        if (second.length != 8) {
            return "";
        }
        let match: string = "";
        for (let i = 0; i < 8; i++) {
            if (first.charAt(i) == second.charAt(i)) {
                match += first.charAt(i);
            }
            else {
                return match;
            }
        }
        return match;
    }

    static randomBetween(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    
    //random a heximal number of 2 digits
    static randomHex(): string {
        let hexRef = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
        return hexRef[this.randomBetween(0, 15)] + hexRef[this.randomBetween(0, 15)];
    }

    static replaceAt(origin: string, index: number, replacement: string): string {
        return origin.substring(0, index) + replacement + origin.substring(index + replacement.length);
    }
}



