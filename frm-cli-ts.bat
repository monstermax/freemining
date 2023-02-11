@echo off

pushd %~dp0

node -r ts-node/register src/frm-cli.ts %*
