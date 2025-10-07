#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, watch } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function generateTypes(localesDir: string, outputFile: string) {
  const resolvedLocalesPath = resolve(localesDir);
  const resolvedOutputPath = resolve(outputFile);

  const outputDir = dirname(resolvedOutputPath);
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  let translationFiles = readdirSync(resolvedLocalesPath).filter(f => f.endsWith('.json'));

  if (translationFiles.length === 0) {
    console.warn('⚠️ No locale files found for type generation.');
    return;
  }

  let typeContent = `// This file has been generated automaticly, DO NOT EDIT MANUALY
import 'i18next';

type NestedKeyOf<T> = {
  [K in keyof T & (string | number)]: T[K] extends object
    ? \`\${K}.\${NestedKeyOf<T[K]>}\`
    : K;
}[keyof T & (string | number)];

`;

  let resourcesContent = '';
  let namespaceTypes = '';

  for (const file of translationFiles) {
    const namespace = file.replace('.json', '');
    const filePath = join(resolvedLocalesPath, file);
    const content = readFileSync(filePath, 'utf8');
    const translations = JSON.parse(content);

    namespaceTypes += `type ${namespace.charAt(0).toUpperCase() + namespace.slice(1)}Keys = \`${namespace}:\${NestedKeyOf<${generateTypeForObject(translations, 2)}>}\`;\n`;

    resourcesContent += `      '${namespace}': ${generateTypeForObject(translations, 6)},\n`;
  }

  const finalContent =
    typeContent +
    namespaceTypes +
    `

type TranslationKeys = ${translationFiles
      .map(ns => `${ns.charAt(0).toUpperCase() + ns.replace('.json', '').slice(1)}Keys`)
      .join(' | ')};

type NamespaceKeys<T extends string> = 
${translationFiles
      .map(ns => `  T extends '${ns.replace('.json', '')}' ? ${ns.charAt(0).toUpperCase() + ns.replace('.json', '').slice(1)}Keys`)
      .join(' :\n')} : never;

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: '${translationFiles[0].replace('.json', '')}';
    resources: {
${resourcesContent}    };
    keySeparator: '.';
    nsSeparator: ':';
  }
}

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: '${translationFiles[0].replace('.json', '')}';
    resources: {
${resourcesContent}    };
    keySeparator: '.';
    nsSeparator: ':';
  }
}

export type { TranslationKeys, NamespaceKeys, ${translationFiles
      .map(ns => `${ns.charAt(0).toUpperCase() + ns.replace('.json', '').slice(1)}Keys`)
      .join(', ')} };
`;

  writeFileSync(resolvedOutputPath, finalContent, 'utf8');
  console.log(`✅ Types i18n generated successfully in: ${resolvedOutputPath}`);
}

function generateTypeForObject(obj: Record<string, any>, indent: number): string {
  let result = '{\n';
  const spaces = ' '.repeat(indent);

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result += `${spaces}'${key}': ${generateTypeForObject(value, indent + 2)},\n`;
    } else {
      result += `${spaces}'${key}': string;\n`;
    }
  }

  result += ' '.repeat(indent - 2) + '}';
  return result;
}

function watchLocales(localesPath: string, outputPath: string) {
  console.log(`👀 Watching for changes in: ${localesPath}`);
  generateTypes(localesPath, outputPath);

  watch(localesPath, { recursive: true }, (eventType, filename) => {
    if (filename?.endsWith('.json')) {
      console.log(`\n📄 File changed: ${filename}`);
      try {
        generateTypes(localesPath, outputPath);
      } catch (err) {
        console.error('❌ Error regenerating types:', err);
      }
    }
  });
}

const args = process.argv.slice(2);
const localesPath = args[0] || join(__dirname, '../src/locale/ru');
const outputPath = args[1] || join(__dirname, '../src/lib/i18n/i18n.d.ts');
const watchMode = args.includes('--watch') || args.includes('--w');

if (watchMode) {
  watchLocales(localesPath, outputPath);
} else {
  generateTypes(localesPath, outputPath);
}
