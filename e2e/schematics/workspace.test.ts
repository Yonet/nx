import {checkFilesExists, cleanup, copyMissingPackages, newApp, readFile, runCLI, runSchematic, updateFile} from '../utils';

describe('Nrwl Workspace', () => {
  beforeEach(cleanup);

  it('should generate an empty workspace', () => {
    newApp('new proj --collection=@nrwl/schematics --skip-install');

    const angularCliJson = JSON.parse(readFile('proj/.angular-cli.json'));
    expect(angularCliJson.apps).toEqual([]);

    const packageJson = JSON.parse(readFile('proj/package.json'));
    expect(packageJson.devDependencies['@nrwl/schematics']).toBeDefined();
    expect(packageJson.dependencies['@nrwl/nx']).toBeDefined();
    checkFilesExists(
        'proj/test.js', 'proj/tsconfig.app.json', 'proj/tsconfig.spec.json', 'proj/tsconfig.e2e.json', 'proj/apps',
        'proj/libs');
  });

  describe('app', () => {
    it('should generate an app', () => {
      newApp('new proj2 --collection=@nrwl/schematics');
      copyMissingPackages('proj2');
      runSchematic('@nrwl/schematics:app --name=myapp', {projectName: 'proj2'});

      const angularCliJson = JSON.parse(readFile('proj2/.angular-cli.json'));
      expect(angularCliJson.apps[0].name).toEqual('myapp');

      checkFilesExists(
          'proj2/apps/myapp/src/main.ts', 'proj2/apps/myapp/src/app/app.module.ts',
          'proj2/apps/myapp/src/app/app.component.ts', 'proj2/apps/myapp/e2e/app.po.ts');

      runCLI('build --aot', {projectName: 'proj2'});
      checkFilesExists('proj2/dist/apps/myapp/main.bundle.js');

      expect(runCLI('test --single-run', {projectName: 'proj2'})).toContain('Executed 1 of 1 SUCCESS');
    });
  });

  describe('lib', () => {
    it('should generate a lib', () => {
      newApp('new proj3 --collection=@nrwl/schematics --skip-install');
      runSchematic('@nrwl/schematics:lib --name=mylib', {projectName: 'proj3'});

      checkFilesExists(
          'proj3/libs/mylib/src/mylib.ts', 'proj3/libs/mylib/src/mylib.spec.ts', 'proj3/libs/mylib/index.ts');
    });

    it('should test a lib', () => {
      newApp('new proj3 --collection=@nrwl/schematics');
      copyMissingPackages('proj3');
      runSchematic('@nrwl/schematics:app --name=myapp', {projectName: 'proj3'});
      runSchematic('@nrwl/schematics:lib --name=mylib', {projectName: 'proj3'});

      expect(runCLI('test --single-run', {projectName: 'proj3'})).toContain('Executed 2 of 2 SUCCESS');
    });
  });

  describe('nglib', () => {
    it('should generate an ng lib', () => {
      newApp('new proj3 --collection=@nrwl/schematics --skip-install');
      runSchematic('@nrwl/schematics:lib --name=mylib --ngmodule', {projectName: 'proj3'});

      checkFilesExists(
          'proj3/libs/mylib/src/mylib.module.ts', 'proj3/libs/mylib/src/mylib.module.spec.ts',
          'proj3/libs/mylib/index.ts');
    });

    it('should test an ng lib', () => {
      newApp('new proj3 --collection=@nrwl/schematics');
      copyMissingPackages('proj3');
      runSchematic('@nrwl/schematics:app --name=myapp', {projectName: 'proj3'});
      runSchematic('@nrwl/schematics:lib --name=mylib --ngmodule', {projectName: 'proj3'});

      expect(runCLI('test --single-run', {projectName: 'proj3'})).toContain('Executed 2 of 2 SUCCESS');
    });

    it('should resolve dependencies on the lib', () => {
      newApp('new proj3 --collection=@nrwl/schematics --npmScope=nrwl');
      copyMissingPackages('proj3');
      runSchematic('@nrwl/schematics:app --name=myapp', {projectName: 'proj3'});
      runSchematic('@nrwl/schematics:lib --name=mylib --ngmodule', {projectName: 'proj3'});

      updateFile('proj3/apps/myapp/src/app/app.module.ts', `
        import { NgModule } from '@angular/core';
        import { BrowserModule } from '@angular/platform-browser';
        import { MylibModule } from '@nrwl/mylib';
        import { AppComponent } from './app.component';

        @NgModule({
          imports: [BrowserModule, MylibModule],
          declarations: [AppComponent],
          bootstrap: [AppComponent]
        })
        export class AppModule {}
      `);

      runCLI('build --aot', {projectName: 'proj3'});
    });
  });
});
