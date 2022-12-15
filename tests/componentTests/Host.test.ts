import { test, expect } from '@jest/globals';
import { Ipv4Address } from '../../src/adressing/Ipv4Address';
import { Ipv6Address } from '../../src/adressing/Ipv6Address';
import { MacAddress } from '../../src/adressing/MacAddress';
import { Host } from '../../src/components/physicalNodes/Host';
import { ConnectionType } from '../../src/components/physicalNodes/PhysicalNode';


test('should create new Host with 1 port correctly with loopbacks', () => {
    let macAddress = MacAddress.generateRandomAddress(new Map());
    let ipv4 = Ipv4Address.getLoopBackAddress();
    let ipv6 = Ipv6Address.getLoopBackAddress();
    let host: Host = new Host("mock-color", "mock-icon", 1, new Map<number, string>([[1,"mock-interface"]]), new Map<number, ConnectionType>([[1, "ethernet"]]),
    new Map<number, MacAddress>([[1, macAddress]]), new Map<number,Ipv4Address>([[1, ipv4]]), new Map<number,Ipv6Address>([[1, ipv6]]), "mock-name");

    expect(host.color).toBe("mock-color");
    expect(host.name).toBe("mock-name");
    expect(host.backgroundPath.includes("mock-icon")).toBe(true);
    expect(host.cssClass.length).toBe(2);
    expect(host.cssClass.includes("host-node")).toBe(true);
    expect(host.cssClass.includes("physical-node")).toBe(true);
    expect(host.layer).toBe(3);
    expect(host.numberOfInterfacesOrPorts).toBe(1);
    expect(host.portData.size).toBe(1);
    expect(host.portData.get(1).size).toBe(5);
    expect(host.portData.get(1).get("Name")).toBe("mock-interface");
    expect(host.portData.get(1).get("Connection Type")).toBe("ethernet");
    expect(host.portData.get(1).get("MAC")).toStrictEqual(macAddress);
    expect(host.portData.get(1).get("IPv4").address).toBe("127.0.0.1");
    expect(host.portData.get(1).get("IPv6").address).toBe("0:0:0:0:0:0:0:1");
});

test('should create new Host with 1 port correctly', () => {
    let macAddress = MacAddress.generateRandomAddress(new Map());
    let ipv4 = Ipv4Address.validateAddress("128.0.0.0", new Map());
    let ipv6 = Ipv6Address.validateAddress("2001:0db8:85a3:0000:0000:8a2e:0370:7334", new Map());
    let host: Host = new Host("mock-color", "mock-icon", 1, new Map<number, string>([[1,"mock-interface"]]), new Map<number, ConnectionType>([[1, "ethernet"]]),
    new Map<number, MacAddress>([[1, macAddress]]), new Map<number,Ipv4Address>([[1, ipv4]]), new Map<number,Ipv6Address>([[1, ipv6]]), "mock-name");

    expect(host.color).toBe("mock-color");
    expect(host.name).toBe("mock-name");
    expect(host.backgroundPath.includes("mock-icon")).toBe(true);
    expect(host.cssClass.length).toBe(2);
    expect(host.cssClass.includes("host-node")).toBe(true);
    expect(host.cssClass.includes("physical-node")).toBe(true);
    expect(host.layer).toBe(3);
    expect(host.numberOfInterfacesOrPorts).toBe(1);
    expect(host.portData.size).toBe(1);
    expect(host.portData.get(1).size).toBe(5);
    expect(host.portData.get(1).get("Name")).toBe("mock-interface");
    expect(host.portData.get(1).get("Connection Type")).toBe("ethernet");
    expect(host.portData.get(1).get("MAC")).toStrictEqual(macAddress);
    expect(host.portData.get(1).get("IPv4").address).toBe("128.0.0.0");
    expect(host.portData.get(1).get("IPv6").address).toBe("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
});


test('should create new Host with multiple ports correctly', () => {
    let mac1 = MacAddress.generateRandomAddress(new Map());
    let mac2 = MacAddress.generateRandomAddress(new Map());
    let mac3 = MacAddress.generateRandomAddress(new Map());

    let ip4_loopback = Ipv4Address.getLoopBackAddress();
    let ip4 = Ipv4Address.validateAddress("128.0.0.0", new Map());
    let ip6_loopback = Ipv6Address.getLoopBackAddress();
    let ip6 = Ipv6Address.validateAddress("2001:0db8:85a3:0000:0000:8a2e:0370:7334", new Map());

    let host: Host = new Host("mock-color", "mock-icon", 3, new Map<number, string>([[1,"mock-interface-1"], [2, "mock-interface-2"], [3, "mock-interface-3"]]),
    new Map<number, ConnectionType>([[1, "ethernet"], [2, "wireless"], [3, "ethernet"]]),
    new Map<number, MacAddress>([[1, mac1], [2, mac2], [3, mac3]]), 
    new Map<number,Ipv4Address>([[1, ip4_loopback], [2,ip4], [3, ip4_loopback]]), 
    new Map<number,Ipv6Address>([[1, ip6_loopback], [2,ip6], [3, ip6_loopback]]), "mock-name");

    expect(host.color).toBe("mock-color");
    expect(host.name).toBe("mock-name");
    expect(host.backgroundPath.includes("mock-icon")).toBe(true);
    expect(host.cssClass.length).toBe(2);
    expect(host.cssClass.includes("host-node")).toBe(true);
    expect(host.cssClass.includes("physical-node")).toBe(true);
    expect(host.layer).toBe(3);
    expect(host.numberOfInterfacesOrPorts).toBe(3);
    expect(host.portData.size).toBe(3);
    expect(host.portData.get(1)).toStrictEqual(new Map<string, any>([["Name","mock-interface-1"], ["Connection Type","ethernet"], ["MAC",mac1], ["IPv4",ip4_loopback], ["IPv6",ip6_loopback]]));
    expect(host.portData.get(2)).toStrictEqual(new Map<string, any>([["Name","mock-interface-2"], ["Connection Type","wireless"], ["MAC",mac2], ["IPv4",ip4], ["IPv6",ip6]]));
    expect(host.portData.get(3)).toStrictEqual(new Map<string, any>([["Name","mock-interface-3"], ["Connection Type","ethernet"], ["MAC",mac3], ["IPv4",ip4_loopback], ["IPv6",ip6_loopback]]));
});