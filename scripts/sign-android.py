from pathlib import Path
p = Path('android/app/build.gradle')
s = p.read_text()
marker = '    buildTypes {'
needle = 'signingConfig signingConfigs.debug'
if s.count(marker) != 1 or s.count(needle) != 2:
    raise SystemExit('Gradle signing configuration changed; review before building')
s = s.replace(marker, '''    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
    }
    buildTypes {''', 1)
pos = s.rfind(needle)
s = s[:pos] + s[pos:].replace(needle, 'signingConfig signingConfigs.release', 1)
p.write_text(s)
