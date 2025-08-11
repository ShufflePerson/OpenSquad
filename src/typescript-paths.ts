import * as tsConfig from '../tsconfig.json';
import { register } from 'tsconfig-paths';

register({
    baseUrl: tsConfig.compilerOptions.outDir + "src",
    paths: tsConfig.compilerOptions.paths,
});