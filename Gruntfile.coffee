module.exports = (grunt) ->

  require('load-grunt-tasks') grunt

  grunt.initConfig
    pkg: grunt.file.readJSON "package.json"

    uglify:
      dist:
        options:
          banner: "/* © 2014, Jeremiah Senkpiel, built: <%= grunt.template.today(\"yyyy-mm-dd\") %> */\n"
        files: [
          { expand: true, cwd: 'src/', src: ['*.js'], dest: 'app/public/', filter: 'isFile', ext: '.min.js' }
        ]

      retinajs:
        options:
          banner: "/*\n * Retina.js v1.1.0\n * Copyright (c) 2013 Imulus, LLC, Ben Atkin, and other contributors\n * MIT License\n */\n"
        files: [
          { expand: true, cwd: 'src/retinajs', src: ['*.js'], dest: 'app/public/', filter: 'isFile', ext: '.min.js' }
        ]

    less:
      dist:
        files: [
          'app/public/ref.css': ['src/less/ref.less']
        ]

    myth:
      dist:
        files: [
          'app/public/ref.css': 'app/public/ref.css'
        ]

    cssmin:
      options:
        banner: "/* © 2014, Jeremiah Senkpiel, built: <%= grunt.template.today(\"yyyy-mm-dd\") %> */"

      minify:
        files: [
          'app/public/ref.min.css': ['app/public/ref.css']
        ]

    copy:
      dist:
        files: [
            { expand: true, cwd: 'node_modules/superagent',  src: 'superagent.js', dest: 'app/public', filter: 'isFile' }
            { expand: true, cwd: 'node_modules/primus',  src: 'primus.js', dest: 'app/public', filter: 'isFile' }
        ]

  grunt.registerTask "default",   ["uglify", "less", "myth", "cssmin", "copy:dist"]
  grunt.registerTask "build",     ["uglify", "less", "myth", "cssmin", "copy:dist"]
