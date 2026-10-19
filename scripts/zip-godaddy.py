# Arma .local/deploy/lusarte-godaddy.zip con el código fuente para GoDaddy Node.js Hosting.
# Uso: npm run zip:godaddy   (ver docs/HOSTING-GODADDY.md)
import os, zipfile, glob
inc=['scripts/next.mjs','package.json','package-lock.json','next.config.ts','tsconfig.json','postcss.config.mjs','next-env.d.ts','.env.example','AGENTS.md','CLAUDE.md']
out='.local/deploy/lusarte-godaddy.zip'
if os.path.exists(out): os.remove(out)
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
    for f in inc:
        if os.path.exists(f): z.write(f,f)
    for d in ['src','public','drizzle']:
        for r,_,fs in os.walk(d):
            for f in fs:
                p=os.path.join(r,f); z.write(p,p.replace(os.sep,'/'))
    for f in glob.glob('.local/uploads/*.webp'):
        z.write(f,'public/assets/uploads/'+os.path.basename(f))
with zipfile.ZipFile(out) as z: print(len(z.namelist()),'archivos, testzip:',z.testzip())
