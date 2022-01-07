import { clearDatabase, connectToDatabase, getLastBlockEntry, getTimeFrameEntry } from "./mongo_connector";
import { ChildProcess, exec, spawn } from "child_process";

import { Logger } from "tslog";
import * as dotenv from "dotenv";
import * as mongoDB from "mongodb";
import * as Buffer from "buffer";
import { delay } from "./utils";

const log: Logger = new Logger({ name: "WATCHDOG" });

dotenv.config();

let client: mongoDB.MongoClient | undefined;


class Watchdog {
    gas_scanner_process?: ChildProcess;
    gas_server_process?: ChildProcess;
    after_kill_delay_ms: number;
    after_start_delay: number;
    allowed_seconds_behind: number;
    check_every_ms: number;

    constructor(after_kill_delay_ms: number, after_start_delay: number, allowed_seconds_behind: number, check_every_ms: number) {
        this.after_kill_delay_ms = after_kill_delay_ms;
        this.after_start_delay = after_start_delay;
        this.allowed_seconds_behind = allowed_seconds_behind;
        this.check_every_ms = check_every_ms;

        log.debug("Watchdog created: " + JSON.stringify(this));
    }

    processClose(code: number) {
        console.log(`child process close all stdio with code: ${code}`);
        this.gas_scanner_process = undefined;
    }
    processExit(code: number) {
        console.log(`Child process exited with code: ${code}`);
        this.gas_scanner_process = undefined;
    }
    processStdOut(data: Buffer) {
        console.log(data.toString().trimEnd());
    }
    processStdErr(data: Buffer) {
        console.log(data.toString().trimEnd());
    }

    startServerProcess() {
        if (!this.gas_server_process && process.env.WATCHDOG_START_SERVER) {
            let useShell = (process.platform == "win32");
            let command_string = process.env.WATCHDOG_START_SERVER.trim().replace("  ", " ");
            log.info("Starting command: " + command_string);
            let command_arr = command_string.split(" ");
            if (command_arr.length < 1) {
                throw "set env WATCHDOG_START_COMMAND"
            }
            let command = command_arr[0];
            let args = command_arr.slice(1);
            let subprocess = spawn(command, args, { shell: useShell });

            subprocess.stdout?.on('data', (data: Buffer) => this.processStdOut(data));
            subprocess.stderr?.on('data', (data: Buffer) => this.processStdErr(data));

            subprocess.on('exit', (code: number) => this.processExit(code));
            subprocess.on('close', (code: number) => this.processClose(code));

            this.gas_server_process = subprocess;
        }
    }

    startGasScannerProcess() {
        if (!this.gas_scanner_process) {
            let useShell = (process.platform == "win32");
            if (!process.env.WATCHDOG_START_COMMAND) {
                throw "set env WATCHDOG_START_COMMAND";
            }
            let command_string = process.env.WATCHDOG_START_COMMAND.trim().replace("  ", " ");
            log.info("Starting command: " + command_string);
            let command_arr = command_string.split(" ");
            if (command_arr.length < 1) {
                throw "set env WATCHDOG_START_COMMAND"
            }
            let command = command_arr[0];
            let args = command_arr.slice(1);
            let subprocess = spawn(command, args, { shell: useShell });

            subprocess.stdout?.on('data', (data: Buffer) => this.processStdOut(data));
            subprocess.stderr?.on('data', (data: Buffer) => this.processStdErr(data));

            subprocess.on('exit', (code: number) => this.processExit(code));
            subprocess.on('close', (code: number) => this.processClose(code));

            this.gas_scanner_process = subprocess;
        }
    }

    async killProcess() {
        log.warn("Killing process...");
        if (process.platform == "win32") {
            if (this.gas_scanner_process?.pid) {
                log.info(`taskkill /pid ${this.gas_scanner_process?.pid} /t /f`);
                spawn("taskkill", ["/pid", this.gas_scanner_process?.pid.toString(), '/t', '/f'], { shell: true });
            }
        }
        else {
            this.gas_scanner_process?.kill();
        }
        log.warn("Waiting for process to kill...");
        await delay(this.after_kill_delay_ms);
        if (this.gas_scanner_process) {
            throw "Failed to kill process";
        }
        log.warn("Process successfully terminated");
    }

    async monitorGasScannerProcess() {
        while (true) {
            if (!this.gas_scanner_process) {
                await this.startGasScannerProcess();
                log.info("Waiting after process started...")
                await delay(this.after_start_delay);
                await this.startServerProcess();
            }
            let tfe = await getTimeFrameEntry("last_10_block");
            log.debug("Received object " + JSON.stringify(tfe));

            await delay(this.check_every_ms);

            let dt = Date.parse(tfe.lastBlockTime);
            let dtNow = Date.now();

            let differenceInSeconds = (dtNow - dt) / 1000.0;

            if (differenceInSeconds > this.allowed_seconds_behind) {
                await this.killProcess();
            }

            log.debug(`Last update is ${differenceInSeconds} seconds old`);
        }

    }
}


async function main() {
    await connectToDatabase();
    let after_kill_delay_ms = parseInt(process.env.WATCHDOG_AFTER_KILL_DELAY_MS ?? "2000");
    let after_start_delay = parseInt(process.env.WATCHDOG_AFTER_START_DELAY_MS  ?? "30000");
    let allowed_seconds_behind = parseInt(process.env.WATCHDOG_ALLOWED_SECONDS_BEHIND ?? "60");
    let check_every_ms = parseInt(process.env.WATCHDOG_CHECK_EVERY_MS ?? "1500");

    let watchdog = new Watchdog(after_kill_delay_ms, after_start_delay, allowed_seconds_behind, check_every_ms);
    await watchdog.monitorGasScannerProcess();
}

main()
    .then(text => {
        log.info("Watchog finished");
    })
    .catch(err => {
        log.error(`Watchdog finished with error: ${err}`);
    });