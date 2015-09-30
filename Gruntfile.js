/*!
 * Bootstrap's Gruntfile
 * http://getbootstrap.com
 * Copyright 2013-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 */

module.exports = function (grunt) {
  'use strict';

  // Force use of Unix newlines
  grunt.util.linefeed = '\n';

  RegExp.quote = function (string) {
    return string.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
  };

  var fs = require('fs-extra');
  var path = require('path');
  var cp = require('child_process');
  var async = require('async');
  var generateGlyphiconsData = require('./grunt/bs-glyphicons-data-generator.js');
  var generateIcomantaData = require('./grunt/icomanta-data-generator.js');
  var BsLessdocParser = require('./grunt/bs-lessdoc-parser.js');
  var generateRawFilesJs = require('./grunt/bs-raw-files-generator.js');
  var updateShrinkwrap = require('./grunt/shrinkwrap.js');

  // Project configuration.
  grunt.initConfig({

    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*!\n' +
            ' * Bootstrap v<%= pkg.version %> (<%= pkg.homepage %>)\n' +
            ' * Copyright 2011-<%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
            ' * Licensed under <%= pkg.license.type %> (<%= pkg.license.url %>)\n' +
            ' */\n',
    jqueryCheck: 'if (typeof jQuery === \'undefined\') { throw new Error(\'Bootstrap\\\'s JavaScript requires jQuery\') }\n\n',

    // Task configuration.
    clean: {
      dist: ['dist', 'docs/dist']
    },

    jshint: {
      options: {
        jshintrc: 'js/.jshintrc'
      },
      grunt: {
        options: {
          jshintrc: 'grunt/.jshintrc'
        },
        src: ['Gruntfile.js', 'grunt/*.js']
      },
      src: {
        src: 'js/*.js'
      },
      test: {
        src: 'js/tests/unit/*.js'
      },
      assets: {
        src: ['docs/assets/js/application.js', 'docs/assets/js/customizer.js']
      }
    },

    jscs: {
      options: {
        config: 'js/.jscs.json',
      },
      grunt: {
        src: ['Gruntfile.js', 'grunt/*.js']
      },
      src: {
        src: 'js/*.js'
      },
      test: {
        src: 'js/tests/unit/*.js'
      },
      assets: {
        src: ['docs/assets/js/application.js', 'docs/assets/js/customizer.js']
      }
    },

    csslint: {
      options: {
        csslintrc: 'less/.csslintrc'
      },
      src: [
        'dist/css/bootstrap.css',
        'dist/css/bootstrap-theme.css',
        'dist/css/bootstrap-manta2015.css',
        'docs/assets/css/docs.css',
        'docs/examples/**/*.css'
      ]
    },

    concat: {
      options: {
        banner: '<%= banner %>\n<%= jqueryCheck %>',
        stripBanners: false
      },
      bootstrap: {
        src: [
          'js/transition.js',
          'js/alert.js',
          'js/button.js',
          'js/carousel.js',
          'js/collapse.js',
          'js/dropdown.js',
          'js/modal.js',
          'js/tooltip.js',
          'js/popover.js',
          'js/scrollspy.js',
          'js/tab.js',
          'js/affix.js'
        ],
        dest: 'dist/js/<%= pkg.name %>.js'
      }
    },

    uglify: {
      options: {
        report: 'min'
      },
      bootstrap: {
        options: {
          banner: '<%= banner %>'
        },
        src: '<%= concat.bootstrap.dest %>',
        dest: 'dist/js/<%= pkg.name %>.min.js'
      },
      customize: {
        options: {
          preserveComments: 'some'
        },
        src: [
          'docs/assets/js/vendor/less.min.js',
          'docs/assets/js/vendor/jszip.min.js',
          'docs/assets/js/vendor/uglify.min.js',
          'docs/assets/js/vendor/blob.js',
          'docs/assets/js/vendor/filesaver.js',
          'docs/assets/js/raw-files.min.js',
          'docs/assets/js/customizer.js'
        ],
        dest: 'docs/assets/js/customize.min.js'
      },
      docsJs: {
        options: {
          preserveComments: 'some'
        },
        src: [
          'docs/assets/js/vendor/holder.js',
          'docs/assets/js/application.js'
        ],
        dest: 'docs/assets/js/docs.min.js'
      }
    },

    less: {
      compileTheme: {
        options: {
          strictMath: true,
          sourceMap: true,
          outputSourceFiles: true,
          sourceMapURL: '<%= pkg.name %>-theme.css.map',
          sourceMapFilename: 'dist/css/<%= pkg.name %>-theme.css.map'
        },
        files: {
          'dist/css/<%= pkg.name %>-theme.css': 'less/theme.less'
        }
      },
      compileManta2015: {
        options: {
          strictMath: true,
          sourceMap: true,
          outputSourceFiles: true,
          sourceMapURL: '<%= pkg.name %>-manta2015.css.map',
          sourceMapFilename: 'dist/css/<%= pkg.name %>-manta2015.css.map'
        },
        files: {
          'dist/css/<%= pkg.name %>-manta2015.css': 'less/manta2015.less'
        }
      },
      minify: {
        options: {
          cleancss: true,
          report: 'min'
        },
        files: {
          'dist/css/<%= pkg.name %>-theme.min.css': 'dist/css/<%= pkg.name %>-theme.css',
          'dist/css/<%= pkg.name %>-manta2015.min.css': 'dist/css/<%= pkg.name %>-manta2015.css'
        }
      }
    },

    cssmin: {
      compress: {
        options: {
          keepSpecialComments: '*',
          noAdvanced: true, // turn advanced optimizations off until the issue is fixed in clean-css
          report: 'min',
          selectorsMergeMode: 'ie8'
        },
        src: [
          'docs/assets/css/docs.css',
          'docs/assets/css/pygments-manni.css'
        ],
        dest: 'docs/assets/css/docs.min.css'
      }
    },

    usebanner: {
      dist: {
        options: {
          position: 'top',
          banner: '<%= banner %>'
        },
        files: {
          src: [
            'dist/css/<%= pkg.name %>-theme.css',
            'dist/css/<%= pkg.name %>-theme.min.css',
            'dist/css/<%= pkg.name %>-manta2015.css',
            'dist/css/<%= pkg.name %>-manta2015.min.css'
          ]
        }
      }
    },

    csscomb: {
      options: {
        config: 'less/.csscomb.json'
      },
      dist: {
        files: {
          'dist/css/<%= pkg.name %>-theme.css': 'dist/css/<%= pkg.name %>-theme.css',
          'dist/css/<%= pkg.name %>-manta2015.css': 'dist/css/<%= pkg.name %>-manta2015.css'
        }
      },
      examples: {
        expand: true,
        cwd: 'docs/examples/',
        src: ['**/*.css'],
        dest: 'docs/examples/'
      }
    },

    copy: {
      fonts: {
        expand: true,
        src: 'fonts/*',
        dest: 'dist/'
      },
      docs: {
        expand: true,
        cwd: './dist',
        src: [
          '{css,js}/*.min.*',
          'css/*.map',
          'fonts/*'
        ],
        dest: 'docs/dist'
      }
    },

    qunit: {
      options: {
        inject: 'js/tests/unit/phantom.js'
      },
      files: 'js/tests/index.html'
    },

    connect: {
      server: {
        options: {
          port: 3000,
          base: '.'
        }
      }
    },

    jekyll: {
      docs: {}
    },

    jade: {
      compile: {
        options: {
          pretty: true,
          data: function () {
            var filePath = path.join(__dirname, 'less/variables.less');
            var fileContent = fs.readFileSync(filePath, {encoding: 'utf8'});
            var parser = new BsLessdocParser(fileContent);
            return {sections: parser.parseFile()};
          }
        },
        files: {
          'docs/_includes/customizer-variables.html': 'docs/jade/customizer-variables.jade',
          'docs/_includes/nav-customize.html': 'docs/jade/customizer-nav.jade'
        }
      }
    },

    validation: {
      options: {
        charset: 'utf-8',
        doctype: 'HTML5',
        failHard: true,
        reset: true,
        relaxerror: [
          'Bad value X-UA-Compatible for attribute http-equiv on element meta.',
          'Element img is missing required attribute src.',
          'No p element in scope but a p end tag seen.',
          'This interface to HTML5 document checking is deprecated.'
        ]
      },
      files: {
        src: '_gh_pages/**/*.html'
      }
    },

    watch: {
      src: {
        files: '<%= jshint.src.src %>',
        tasks: ['jshint:src', 'qunit', 'jekyll']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'qunit', 'jekyll']
      },
      less: {
        files: 'less/*.less',
        tasks: ['less','dist-docs']
      },
      docs: {
        files: 'docs/**/*',
        tasks: 'jekyll'
      }
    },

    sed: {
      versionNumber: {
        pattern: (function () {
          var old = grunt.option('oldver');
          return old ? RegExp.quote(old) : old;
        })(),
        replacement: grunt.option('newver'),
        recursive: true
      }
    },

    'saucelabs-qunit': {
      all: {
        options: {
          build: process.env.TRAVIS_JOB_ID,
          concurrency: 10,
          urls: ['http://127.0.0.1:3000/js/tests/index.html'],
          browsers: grunt.file.readYAML('test-infra/sauce_browsers.yml')
        }
      }
    },

    exec: {
      npmUpdate: {
        command: 'npm update'
      },
      npmShrinkWrap: {
        command: 'npm shrinkwrap --dev'
      }
    },

    webfont: {
      icons: {
        src: 'icomanta_source/*.svg',
        dest: 'fonts',
        destCss: 'less',
        options: {
          font: 'icomanta',
          hashes: false,
          types: 'eot,woff,ttf,svg',
          stylesheet: 'less',
          startCodepoint: 0xE600,
          codepointsFile: 'templates/codepoints.json',
          htmlDemo: false,
          template: 'templates/manta.css',
          templateOptions: {
            baseClass: 'icomanta',
            classPrefix: 'icon-'
          }
        }
      }
    }
  });


  // These plugins provide necessary tasks.
  require('load-grunt-tasks')(grunt, {scope: 'devDependencies'});

  // Docs HTML validation task
  grunt.registerTask('validate-html', ['jekyll', 'validation']);

  // Test task.
  var testSubtasks = [];
  // Skip core tests if running a different subset of the test suite
  if (!process.env.TWBS_TEST || process.env.TWBS_TEST === 'core') {
    testSubtasks = testSubtasks.concat(['dist-css', 'csslint', 'jshint', 'jscs', 'qunit', 'build-customizer-html']);
  }
  // Skip HTML validation if running a different subset of the test suite
  if (!process.env.TWBS_TEST || process.env.TWBS_TEST === 'validate-html') {
    testSubtasks.push('validate-html');
  }
  // Only run Sauce Labs tests if there's a Sauce access key
  if (typeof process.env.SAUCE_ACCESS_KEY !== 'undefined' &&
      // Skip Sauce if running a different subset of the test suite
      (!process.env.TWBS_TEST || process.env.TWBS_TEST === 'sauce-js-unit')) {
    testSubtasks.push('connect');
    testSubtasks.push('saucelabs-qunit');
  }
  grunt.registerTask('test', testSubtasks);

  // JS distribution task.
  grunt.registerTask('dist-js', ['concat', 'uglify']);

  // CSS distribution task.
  grunt.registerTask('dist-css', ['less', 'cssmin', 'csscomb', 'usebanner']);

  // Docs distribution task.
  grunt.registerTask('dist-docs', 'copy:docs');

  // Full distribution task.
  grunt.registerTask('dist', ['clean', 'webfont:icons', 'dist-css', 'copy:fonts', 'dist-js', 'dist-docs']);

  // Default task.
  grunt.registerTask('default', ['test', 'dist', 'build-glyphicons-data', 'build-icomanta-data', 'build-customizer', 'update-shrinkwrap']);

  // Version numbering task.
  // grunt change-version-number --oldver=A.B.C --newver=X.Y.Z
  // This can be overzealous, so its changes should always be manually reviewed!
  grunt.registerTask('change-version-number', 'sed');

  grunt.registerTask('build-glyphicons-data', generateGlyphiconsData);
  grunt.registerTask('build-icomanta-data', generateIcomantaData);

  // task for building customizer
  grunt.registerTask('build-customizer', ['build-customizer-html', 'build-raw-files']);
  grunt.registerTask('build-customizer-html', 'jade');
  grunt.registerTask('build-raw-files', 'Add scripts/less files to customizer.', function () {
    var banner = grunt.template.process('<%= banner %>');
    generateRawFilesJs(banner);
  });

  // Task for updating the npm packages used by the Travis build.
  grunt.registerTask('update-shrinkwrap', ['exec:npmUpdate', 'exec:npmShrinkWrap', '_update-shrinkwrap']);
  grunt.registerTask('_update-shrinkwrap', function () { updateShrinkwrap.call(this, grunt); });

  grunt.registerTask('gh-pages', 'Make gh-pages less stupid', function() {
    var done = this.async();
    var revParse = cp.spawn('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
    var branch;
    revParse.stdout.on('data', function(data) {
      branch = data.toString().trim();
    });
    revParse.on('close', function(code) {
      if (branch === 'master') {
        fs.readdir('_gh_pages', function(err, files) {
          fs.copy('_gh_pages', '_gh_pages_temp', function(err) {
            if (err) {
              grunt.fail.fatal(err);
            } else {
              var br = cp.spawn('git', ['checkout', 'gh-pages']);
              br.on('close', function(code) {
                if (code) {
                  grunt.fail.fatal('Could not checkout gh-pages branch', code);
                } else {
                  async.each(files, function(file, next) {
                    fs.copy('_gh_pages_temp/' + file, './' + file, next);
                  }, function(err) {
                    if (err) {
                      grunt.fail.fatal(err);
                    } else {
                      fs.remove('_gh_pages_temp', function(err) {
                        if (err) {
                          grunt.fail.fatal(err);
                        } else {
                          fs.readFile('index.html', function(err, contents) {
                            fs.writeFile('index.html', contents.toString().replace(/\.\.\//g, ''), 'utf-8', function(err) {
                              if (err) {
                                grunt.fail.fatal(err);
                              } else {
                                done();
                              }
                            });
                          });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        });
      } else {
        grunt.fail.fatal('Not on master branch. Aborting');
        done();
      }
    });
  });
};
