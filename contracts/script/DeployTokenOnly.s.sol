// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {AnonsToken} from "../src/AnonsToken.sol";
import {IAnonsDescriptor} from "../src/interfaces/IAnonsDescriptor.sol";
import {IAnonsSeeder} from "../src/interfaces/IAnonsSeeder.sol";

contract DeployTokenOnly is Script {
    function run() external returns (address token) {
        // Load from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address clawdia = vm.envAddress("CLAWDIA_ADDRESS");
        IAnonsDescriptor descriptor = IAnonsDescriptor(0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8);
        IAnonsSeeder seeder = IAnonsSeeder(0x62a5f2FC70b9037eFA6AbA86113889E6dd501849);

        // Clawdia's seed
        IAnonsSeeder.Seed memory clawdiaSeed = IAnonsSeeder.Seed({
            background: 0,
            head: 0,
            visor: 0,
            antenna: 0,
            body: 0,
            accessory: 0,
            isDusk: false
        });

        vm.startBroadcast(deployerPrivateKey);

        AnonsToken deployed = new AnonsToken(clawdia, descriptor, seeder, clawdiaSeed);
        token = address(deployed);

        console.log("AnonsToken deployed:", token);

        vm.stopBroadcast();
    }
}
