const ts = require('typescript'); const path=require('path');let input='';
process.stdin.on('data',d=>input+=d);process.stdin.on('end',()=>{
 const sources=JSON.parse(input);const configFile=ts.findConfigFile(process.cwd(),ts.sys.fileExists,'tsconfig.json');
 const config=ts.readConfigFile(configFile,ts.sys.readFile);const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,path.dirname(configFile));
 const options={...parsed.options,noEmit:true,incremental:false};const host=ts.createCompilerHost(options);
 const overlay=new Map(Object.entries(sources).map(([name,code])=>[path.resolve(name),code]));
 const read=host.readFile.bind(host),exists=host.fileExists.bind(host);
 host.readFile=name=>overlay.get(path.resolve(name))??read(name);
 host.fileExists=name=>overlay.has(path.resolve(name))||exists(name);
 const program=ts.createProgram([...overlay.keys()],options,host);
 const diagnostics=ts.getPreEmitDiagnostics(program);
 for(const d of diagnostics){const where=d.file&&d.start!=null?d.file.fileName+':'+(d.file.getLineAndCharacterOfPosition(d.start).line+1):'';console.log(where,ts.flattenDiagnosticMessageText(d.messageText,' '));}
 if(diagnostics.length)process.exitCode=1;else console.log('PASS: TypeScript semantic check (no emit)');
});
