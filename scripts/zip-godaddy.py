# Arma .local/deploy/lusarte-godaddy.zip con el código fuente para GoDaddy Node.js Hosting.
# Uso: npm run zip:godaddy   (ver docs/HOSTING-GODADDY.md)
import os, zipfile
inc=['scripts/next.mjs','package.json','package-lock.json','next.config.ts','tsconfig.json','postcss.config.mjs','next-env.d.ts','.env.example','AGENTS.md','CLAUDE.md']
out='.local/deploy/lusarte-godaddy.zip'
if os.path.exists(out): os.remove(out)
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
    for f in inc:
        if os.path.exists(f): z.write(f,f)
    for d in ['src','public','drizzle']:
        for r,_,fs in os.walk(d):
            for f in fs:
                p=os.path.join(r,f).replace(os.sep,'/')
                if p.startswith('public/assets/uploads/'): continue
                z.write(p,p)
    # Las fotos NO van en el zip: viven solo en el disco de GoDaddy (public/assets/uploads, que se conserva
    # entre publicaciones) y subirlas aquí podría pisar las de producción.
with zipfile.ZipFile(out) as z: print(len(z.namelist()),'archivos, testzip:',z.testzip())
