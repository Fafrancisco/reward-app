import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const base = process.env.GITHUB_EVENT_BEFORE;
const head = process.env.GITHUB_SHA || 'HEAD';
const app = JSON.parse(readFileSync('app.json', 'utf8'));
const currentVersion = app.expo?.version;

if (!currentVersion) {
  throw new Error('Não encontrei expo.version em app.json. Não é seguro publicar OTA sem runtime version.');
}

let changedFiles = [];
try {
  const diffBase = base && !/^0+$/.test(base) ? base : `${head}^`;
  changedFiles = execFileSync('git', ['diff', '--name-only', diffBase, head], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
} catch {
  // A primeira revisão da história não tem build anterior a que um OTA possa ser compatível.
  console.log('Sem commit anterior para comparar; a APK inicial será o primeiro runtime OTA.');
  process.exit(0);
}

const nativeAffecting = changedFiles.some((file) =>
  file === 'app.json' ||
  file === 'app.config.js' ||
  file === 'app.config.ts' ||
  file === 'package.json' ||
  file === 'package-lock.json' ||
  file.startsWith('plugins/') ||
  file.startsWith('android/'),
);

if (!nativeAffecting) {
  console.log('Alteração sem ficheiros de configuração/dependências nativas; runtime OTA compatível.');
  process.exit(0);
}

let previousVersion;
try {
  previousVersion = JSON.parse(execFileSync('git', ['show', `${base && !/^0+$/.test(base) ? base : `${head}^`}:app.json`], { encoding: 'utf8' })).expo?.version;
} catch {
  console.log('Sem app.json anterior; a APK inicial define o primeiro runtime.');
  process.exit(0);
}

const parse = (value) => String(value).split('.').map((part) => Number.parseInt(part, 10));
const oldParts = parse(previousVersion);
const newParts = parse(currentVersion);
const increased = newParts.some((part, index) => {
  for (let earlier = 0; earlier < index; earlier += 1) {
    if (newParts[earlier] !== oldParts[earlier]) return false;
  }
  return part > (oldParts[index] ?? 0);
});

if (!previousVersion || !increased) {
  throw new Error(
    `Detetei uma alteração potencialmente nativa. Incrementa expo.version em app.json ` +
    `(${previousVersion ?? 'versão anterior desconhecida'} → versão superior a ${currentVersion}) ` +
    'para criar novo runtime e APK antes de publicar OTA.',
  );
}

console.log(`Runtime alterado de ${previousVersion} para ${currentVersion}; o OTA é compatível com o novo APK.`);
