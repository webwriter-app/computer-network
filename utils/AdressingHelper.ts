export class AddressingHelper {
    static numTo8BitBinary(num: number): string {
        if (num == undefined || num == 0) {
            return "00000000";
        }
        let binary = num.toString(2);
        return binary.padStart(8, "0");
    }

    static binaryToDecimalOctets(binary: string): number[] {
        if (binary.length != 32) {
            return null;
        }
        return [parseInt(binary.slice(0, 8), 2), parseInt(binary.slice(8, 16), 2),
        parseInt(binary.slice(16, 24), 2), parseInt(binary.slice(24, 32), 2)];
    }

    static decimalStringWithDotToBinary(decimal: string): string {
        let decimalOctets: string[] = decimal.split('.');
        let bin = "";
        if (decimalOctets.length != 4) {
            return null;
        }
        else {
            decimalOctets.forEach(octet => bin += (+octet).toString(2).padStart(8, "0"));
            return bin;
        }
    }

    static getPrefix(strings: string[]) {
        // check border cases size 1 array and empty first word)
        if (!strings[0] || strings.length == 1) return strings[0] || "";
        let i = 0;
        // while all words have the same character at position i, increment i
        while (strings[0][i] && strings.every(w => w[i] === strings[0][i]))
            i++;

        // prefix is the substring from the beginning to the last successfully checked i
        return strings[0].substring(0, i);
    }

    static randomBetween(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    //random a heximal number of 2 digits
    static randomHex(): string {
        let hexRef = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
        return hexRef[this.randomBetween(0, 15)] + hexRef[this.randomBetween(0, 15)];
    }

    //TODO: this is buggyy
    static replaceAt(origin: string, index: number, replacement: string): string {
        if (index >= origin.length) console.log("index out of bound");
        console.log(index);
        if (index == 0) return replacement + origin.substring(replacement.length);
        return origin.substring(0, index-1) + replacement + origin.substring(index - 1 + replacement.length);
    }
}



