// Required to fix bug (for github runner) https://github.com/expo/expo/issues/25905
import fs from 'fs';
import path from 'path';

const podfilePath = path.join(__dirname, '../ios/Podfile');

function main() {
  fs.readFile(podfilePath, 'utf8', (err, data) => {
    if (err) {
      console.log(err);
      return;
    }
  
    const result = data.replace(
      /target 'mobileapp' do/g,
      "use_modular_headers!\ntarget 'mobileapp' do",
    );
  
    fs.writeFile(podfilePath, result, 'utf8', (err) => {
      if (err) console.log(err);
    });
  });
}

main();
