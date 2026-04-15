import { Command } from 'commander';

declare function repoUrlToFolderName(repoUrl: string): string;

declare const logo = "\n  ___ _____ _   ___ _  _____ _____\n / __|_   _/_\\ / __| |/ /_ _|_   _|\n \\__ \\ | |/ _ \\ (__| ' < | |  | |\n |___/ |_/_/ \\_\\___|_|\\_\\___| |_|  ";
declare const version: string;
declare function createProgram(): Command;
declare function main(argv?: string[]): Promise<void>;

export { createProgram, logo, main, repoUrlToFolderName, version };
