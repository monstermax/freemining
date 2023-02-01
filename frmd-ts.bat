@echo off

pushd %~dp0

exec ./ts-node src/frmd.ts %*
