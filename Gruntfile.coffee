module.exports = (grunt) ->

  require('load-grunt-tasks') grunt

  grunt.initConfig
    pkg: grunt.file.readJSON "package.json"

    uglify:
      dist:
        options:
          banner: "/* © 2014, Jeremiah Senkpiel, built: <%= grunt.template.today(\"yyyy-mm-dd\") %> */\n"
        files: [
          { expand: true, cwd: 'src/', src: ['*.js', '!*.*.js'], dest: 'app/public/', filter: 'isFile', ext: '.min.js' }
          { expand: true, cwd: 'src/', src: '*.TextInput.js', dest: 'app/public/', filter: 'isFile', ext: '.TextInput.min.js' }
        ]

      retinajs:
        options:
          banner: "/*\n * Retina.js v1.1.0\n * Copyright (c) 2013 Imulus, LLC, Ben Atkin, and other contributors\n * MIT License\n */\n"
        files: [
          { expand: true, cwd: 'src/retinajs', src: ['*.js', '!*.*.js'], dest: 'app/public/', filter: 'isFile', ext: '.min.js' }
        ]

    myth:
      dist:
        files: [
          'app/public/ref.css': ['src/ref.css']
        ]

    cssmin:
      options:
        banner: "/* © 2014, Jeremiah Senkpiel, built: <%= grunt.template.today(\"yyyy-mm-dd\") %> */"

      minify:
        files: [
          'app/public/ref.min.css': ['app/public/ref.css']
          'app/public/kappacino/styles.min.css': ['app/public/kappacino/styles.css']
          'app/public/xenon.min.css': ['app/public/xenon.css']
        ]

    replace:
      kapp_html:
        src: [
          'app/server/views/kapp_home.html'
          'app/server/views/kapp_404.html'
          'app/server/views/kapp_about.html'
          'app/server/views/kapp_freelance.html'
        ]
        dest: '../kappacino/'
        replacements: [{
          from: '../s/kappacino/img'
          to: 'images'
        }, {
          from: '../s/kappacino/'
          to: ''
        }]
      kapp_css:
        src: [
          'app/public/kappacino/styles.css'
          'app/public/kappacino/styles.min.css'
        ]
        dest: '../kappacino/'
        replacements: [{
          from: 'http://searchbeam.jit.su/s'
          to: 'fonts'
        }]

    copy:
      main:
        files: [
            { expand: true, cwd: 'app/public/kappacino/img',  src: '**', dest: '../kappacino/images', filter: 'isFile' }
        ]
      dist:
        files: [
            { expand: true, cwd: 'node_modules/superagent',  src: 'superagent.js', dest: 'app/public', filter: 'isFile' }
            { expand: true, cwd: 'node_modules/primus',  src: 'primus.js', dest: 'app/public', filter: 'isFile' }
        ]

  grunt.registerTask "default", ["uglify", "myth", "cssmin", "copy:dist"]
  grunt.registerTask "build", ["uglify", "myth", "cssmin", "copy:dist"]
  grunt.registerTask "kappacino", ["uglify", "myth", "cssmin", "replace", "copy:main"]
