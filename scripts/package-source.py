from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent.parent
files=[root/p for p in ['README.md','AGENTS.md','AI_REVIEW.md','CONTRIBUTING.md','LICENSE','project.json','package.json','package-lock.json','drizzle.config.ts','tsconfig.json','vite.config.ts','server.ts','index.html','tests.mjs','tests-advanced.mjs','tests-metal.mjs','tests-v4.mjs','tests-mcp.mjs','advanced-section.html','metal-section.html','community-section.html','fit-section.html']]
for directory in ['docs','db','drizzle','worker','scripts','.github','python','src','public']:
    files.extend(p for p in (root/directory).rglob('*') if p.is_file() and '__pycache__' not in p.parts and 'node_modules' not in p.parts and not p.name.endswith('.zip'))
files.extend(p for p in (root/'dist').iterdir() if p.is_file() and p.suffix in ['.html','.css','.mjs','.json','.csv','.md','.txt'])
with zipfile.ZipFile(root/'dist/pea-kinetics-source.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for p in sorted(set(files)):
        archive.write(p,p.relative_to(root))
print('Packaged',len(set(files)),'source files; no hosting configuration or user submissions included.')
