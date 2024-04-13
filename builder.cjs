const { version, commit } = require('./metadata.json');
const builder = require('electron-builder');
const fs = require('fs');
const { join } = require('path');
const { Platform, Arch } = builder;
/**
* @type {import('electron-builder').Configuration}
* @see https://www.electron.build/configuration/configuration
*/
const config = {
  appId: 'io.github.read-cat',
  productName: 'ReadCat',
  asar: true,
  asarUnpack: [
    'node_modules'
  ],
  compression: 'maximum',
  directories: {
    'output': `build`
  },
  files: [
    'dist',
    'dist-electron',
    '!node_modules/**/*.map',
    '!dist/favicon.icns',
    '!dist/512x512.png',
  ],
  win: {
    icon: 'public/favicon.ico',
    artifactName: '${productName}-windows-${arch}' + `-${version}.${commit.slice(0, 8)}` + '.${ext}',
  },
  nsis: {
    installerIcon: 'public/favicon.ico',
    installerHeaderIcon: 'public/favicon.ico',
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: true
  },
  mac: {
    icon: 'public/favicon.icns',
    artifactName: '${productName}-darwin-${arch}' + `-${version}.${commit.slice(0, 8)}` + '.${ext}',
    darkModeSupport: true
  },
  linux: {
    icon: 'public/512x512.png',
    artifactName: '${productName}-linux-${arch}' + `-${version}.${commit.slice(0, 8)}` + '.${ext}',
  }
}


const promises = [];
let platforms = process.argv.slice(2);
(platforms.length <= 0) && (platforms.push('--win32=x64,ia32', '--darwin=x64,arm64', '--linux=x64,arm64'));
platforms.forEach(a => {
  let targets = void 0;
  const values = a.trim().split('=');
  const platform = values[0];
  const archs = values[1] === void 0 ? [] : values[1].split(',').map(a => {
    let arch;
    switch (a) {
      case 'ia32':
        arch = Arch.ia32;
        break;
      case 'x64':
        arch = Arch.x64;
        break;
      case 'arm64':
        arch = Arch.arm64;
        break;
      case 'armv7l':
        arch = Arch.armv7l;
        break;
      case 'universal':
      default:
        arch = Arch.universal;
        break;
    }
    return arch;
  });
  if (platform === '--win32') {
    (archs.length <= 0) && (archs.push(Arch.x64, Arch.ia32));
    targets = Platform.WINDOWS.createTarget(['nsis', 'tar.gz'], ...archs);
  } else if (platform === '--darwin') {
    (archs.length <= 0) && (archs.push(Arch.x64, Arch.arm64));
    targets = Platform.MAC.createTarget(['dmg', 'tar.gz'], ...archs);
  } else if (platform === '--linux') {
    (archs.length <= 0) && (archs.push(Arch.x64, Arch.arm64));
    targets = Platform.LINUX.createTarget(['AppImage', 'tar.gz'], ...archs);
  }
  targets && promises.push(builder.build({
    targets,
    config
  }));
});
Promise.allSettled(promises).then(res => {
  for (const item of res) {
    if (item.status === 'fulfilled') {
      console.log(item.value);
    } else {
      console.error('build error', item.reason);
    }
  }
  const buildDir = join(__dirname, 'build');
  const releaseDir = join(__dirname, 'release');
  fs.mkdirSync(releaseDir, {
    recursive: true
  });
  fs.existsSync(buildDir) && fs.readdirSync(buildDir, { encoding: 'utf-8' }).forEach(file => {
    console.log(buildDir, file);
    if (
      file.toLowerCase().endsWith('.exe') ||
      file.toLowerCase().endsWith('.tar.gz') ||
      file.toLowerCase().endsWith('.dmg') ||
      file.toLowerCase().endsWith('.appimage')
    ) {


      console.log('file:', join(buildDir, file), join(releaseDir, file));
      fs.renameSync(join(buildDir, file), join(releaseDir, file));
    }
  });
}).catch(e => {
  console.error(e);
});
