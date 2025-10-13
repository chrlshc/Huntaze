# Playbook — Incident Login OnlyFans

## Scope
Diagnostiquer et rétablir un login OF via Worker Playwright (ECS Fargate).

## Symptômes fréquents
- Champ email non détecté / non remplissable
- Boucle sur “Use email / Continue”
- OTP demandé
- Challenge/captcha
- Timeout/redirection inattendue

## Check rapide (90 s)
1. Ouvrir artefacts S3 (trace.zip, last.png, page.mp4) du run.
2. `npx playwright show-trace ./trace.zip` pour rejouer les étapes.
3. Vérifier logs CloudWatch du task run (erreurs, steps).
4. Regarder l’URL finale (/login, /auth, /my, etc.).

## Arbre de décision
- **Email introuvable** → cibler `role=dialog` puis re-chercher, sinon `css:light(input[type="email"])`, sinon fallback typing → rejouer.
- **“Use email” visible** → cliquer + **“Continue”** si présent → rejouer.
- **OTP requis** → récupérer le code côté owner et relancer avec `OTP_CODE=<code>` (valide ~60–90 s) → surveiller succès.
- **Captcha/challenge** → marquer `linkState=challenge`; décider action manuelle ou proxy résidentiel (si récurrent).

## Commandes utiles
- S3 list: `aws s3 ls s3://<bucket>/playwright-traces/<userId>/ --recursive`
- Trace: `aws s3 cp s3://.../trace.zip ./ && npx playwright show-trace trace.zip`
- Vidéo: `aws s3 cp s3://.../page.mp4 ./ && open page.mp4`
- Logs: `aws logs get-log-events --log-group-name /huntaze/of/browser-worker --log-stream-name <stream>`

## OTP
- Afficher “OTP requis” côté app + notifier Slack/Email immédiatement.
- Rejouer `ACTION=login` avec `OTP_CODE`.

## Observabilité
- Alarme `OF-LoginFailures-gt5-per-hour` (>=5/h).
- Alarme `OF-MemoryUsageMB-gt7000` (2/3 sur 60 s).

## Notes Playwright
- Préférer `getByRole()`, gérer `role=dialog`.
- `css:light()` peut aider pour certains shadow DOM (à utiliser en dernier recours).

