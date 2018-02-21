'use strict';

module.exports = function (grunt) {

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Configurable paths
  var config = {
    app: 'app',
    dist: 'dist',
    tmp: '.tmp'
  };
  
  //Check if task should fail
  var failMessage = '';
  grunt.registerTask('failCheck', 'Checks if build should fail.', function() {
    if(failMessage.length > 0) {
      grunt.fail.warn(failMessage);
    } else {
      console.log('No WSOD errors found');
    }
  });
  
  grunt.loadNpmTasks('grunt-dom-munger');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-postcss');
  grunt.loadNpmTasks('grunt-pixrem');

  // Define the configuration for all the tasks
  grunt.initConfig({

    // Project settings
    config: config,

    // Watches files for changes and runs tasks based on the changed files
    watch: {
      js: {
        files: ['<%= config.app %>/js/{,*/}*.js', '<%= config.app %>/{,*/}*.html', '<%= config.app %>/{,*/}*.less' ],
        tasks: 'build_pieces',
        options: {
          livereload: true
        }
      },
      gruntfile: {
        files: ['Gruntfile.js']
      }
    },

    // The actual grunt server settings
    connect: {
      options: {
        port: 9000,
        open: 'http://localhost:9000/interior.html',
        // Change this to '0.0.0.0' to access the server from outside
        hostname: '0.0.0.0'
      },
      dist: {
        options: {
          base: '.tmp'
        }
      }
    },

    // Empties folders to start fresh
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '<%= config.dist %>/*'
          ]
        }]
      },
      tmp: '.tmp',
      //Delete html files from dist
      distHtml: ['<%= config.dist %>/*.html', '<%= config.dist %>/concat'],
      includes: '.tmp/includes'
    },

    // Make sure code styles are up to par and there are no obvious mistakes
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish'),
        reporterOutput: ''
      },
      all: [
        // checking only imod.custom.js for errors
        '<%= config.app %>/js/imods.custom.js'
      ]
    },

    // add fallbacks for rem units
    pixrem: {
      options: {
        rootvalue: '10px',
        replace: false
      },
      dist: {
        src: '.tmp/style.css',
        dest: '.tmp/style.css'
      }
    },

    // Post CSS for Less
    postcss: {
      options: {
        map: true,
        processors: [
          require('autoprefixer')({browsers: ['> 0.5%', 'last 5 versions', 'Firefox ESR', 'Opera 12.1']}), // add vendor prefixes
        ]
      },
      dist: {
        files: [{
          src: '.tmp/style.css',
          dest: '.tmp/style.css'
        }]
      }
    },

    // Reads HTML for usemin blocks to enable smart builds that automatically
    // concat, minify and revision files. Creates configurations in memory so
    // additional tasks can operate on them
    useminPrepare: {
      // html: '<%= config.app %>/index.html',
      src: ['.tmp/*.html'],
      options: {
        dest: '.tmp',
      }
    },
    
    usemin: {
      html: ['.tmp/{,*/}*.html'],
      css: ['.tmp/css/{,*/}*.css'],
      js: ['.tmp/js/*.js'],
      options: {
        assetsDirs: ['.tmp', '.tmp/images', '.tmp/fonts'],
        patterns: {
          // FIXME While usemin won't have full support for revved files we have to put all references manually here
          js: [
              [/(images\/.*?\.(?:gif|jpeg|jpg|png|webp|svg))/gm, 'Update the JS to reference our revved images']
          ]
        }
      }
    },

     cssmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp/concat/css/',
          src: ['*.css', '!*style.css'],
          dest: '.tmp/css/',
          ext: '.css'
        }]
      }
    },
  
    uglify: {
      options: {
        preserveComments: 'all',
        mangle: false,
        compress: false
      }
    },

    // Copies remaining files to places other tasks can use
    copy: {
      tmp: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= config.app %>',
          dest: '.tmp',
          src: [
            '*.{ico,png,txt}',
            'images/{,*/}*.*',
            '{,*/}*.aspx',
            '{,*/}*.html',
            'fonts/*.*',
            'css/{,*/}*.vendor.css',
            'less/{,*/}*.less',
            'style.css',
			      'js/*.custom.js',
            'js/{,*/}*.main.js'
          ],
        }]
      },
      styles: {
        expand: true,
        dot: true,
        cwd: '<%= config.app %>/css',
        dest: '.tmp/css/',
        src: '{,*/}*.vendor.css'
      },
      // Convert html extention to aspx
      htmlToaspx: {
        expand: true,
        src: ['*.html','!*.aspx'],
        dest: '<%= config.dist %>',
        cwd: '<%= config.dist %>',
        ext: '.aspx',
        extDot: 'last'
      },
      tmpToDist: {
        expand: true,
        src: '{,*/}*.*',
        dest: '<%= config.dist %>',
        cwd: '.tmp'
      },
    },

    less: {
      options: {
        sourceMap:true,
        compress: false,
        yuicompress: false,
        optimization: 2,
        sourceMapFilename: 'app/style.css.map',
        sourceMapFileInline: false,
        sourceMapURL: 'app/style.css.map'
      },
      development: {
        files: { 'app/style.css' : 'app/style.less' }
      },
      //bootstrap: {
      //  files: { 'app/css/bootstrap.css' : 'app/less/bs/bootstrap.less' }
      //},
      pikabu: {
        files: { 'app/css/pikabu.css' : 'app/less/pikabu/pikabu.css' }
      }
    },

    // replace things with other things
    replace: {
      dist: {
        options: {
          patterns: [
            //Replace scripts with FileInclude script placeholders - skip script tags in IE if tags
            {
              match: /[^\[if ]<script[^src]*?src=\"(.*\/)([A-Za-z0-9]+)(.+?)\"[^>]*?><\/script>/g,
              replacement: '\n<imod:ScriptPlaceHolder id="$2" type="FileInclude" url="$1$2$3" runat="server"></imod:ScriptPlaceHolder>'
            },
            //Replace document ready scripts with JQueryOnDocumentReady script placeholders
            {
              match: /<script.*?>\s*?jQuery\(document\)\.ready\(function\(\)\{([\s\S]*)\}\)\s*?<\/script>/g,
              replacement: '<imod:ScriptPlaceHolder id="onload" type="JQueryOnDocumentReady" runat="server">$1</imod:ScriptPlaceHolder>'
            },
            //Uncomment things
            {
              match: /<!--build:uncomment(.*?)endbuild-->/g,
              replacement: '$1'
            },
            //Delete Things
            {
              match: /(<!--\s*?grunt:delete\s*?-->\s*?[\s\S]*?\s*?<!--\s*?endgrunt\s*?-->)/g,
              replacement: ''
            },
            //Check for Pipe character in href attributes - fail build if found - System will WSOD if an href has "|" character (<link> tags in particular)
            {
              match: /<([^>\s\S]*)[^>]*href=\"[^\"]*\|[^\"]*\"[^>]*>/g,
              replacement: function(found){
                failMessage += ('\nPipe character "|" found in the href attribute at:\n ' + found + '\n');
              }
            }
          ]
        },
        files: [
          {expand: true, flatten: true, src: ['<%= config.dist %>/*.aspx'], dest: 'dist/'}
        ]
      }
    },
  
    //Manipulte through the DOM
    dom_munger: {
      dist: {
        options: {
        callback: function($,file){
          //Check IDs for duplicates, invalid characters, check Content Areas for runat server
          //Also delete content inside of Content Areas
          var ids = {},
            runat;
          $('*[id]').each(function(){
            //Check ID for invalid characters
            if ($(this).attr('id').indexOf(' ') > -1){
              failMessage += '\nInvalid characters in #' + $(this).attr('id') + ': No spaces!\n';
            }
            //Check that ID starts with letter
            if (!$(this).attr('id').charAt(0).match(/[a-zA-Z]/)){
              failMessage += '\nInvalid characters in #' + $(this).attr('id') + ': ID must begin with a letter!\n';
            }
            //Check if ID has already been processed
            if ($(this).attr('id') && ids[$(this).attr('id')]) {
              failMessage += '\nDuplicate ID found at #' + $(this).attr('id') + '.\n';
            }
            //ID processed, add to array
            ids[$(this).attr('id')] = 1;
            //if Content Area, extra tasks
            if ($(this).attr('id').indexOf('Content') === 0){
              //Check for runat="server"
              runat = $(this).attr('runat');
              if (runat != 'server' && runat != 'Server') {
                failMessage += '\nMissing runat="server" on Content Area #' + $(this).attr('id') + '.\n';
              }
              if ($(this).attr('id').length > 35){
                failMessage += '\nID found at #' + id + ' is too long. Content area IDs must be 35 characters or less.\n';
              }
              //Delete Content
              $(this).html('');
            }
          });
          //Fail build task if an ID is found on stylesheet other than MainStyle
          $('link[id]:not(#MainStyle)').each(function(){
            failMessage += '\nID #' + $(this).attr('id') + ' found on <link> tag - stylesheets cannot have an ID (other than #MainStyle).\n';
          });
          
          //Add appropriate asp tags back to ContentMiddle
          $('#ContentMiddle').html('<asp:PlaceHolder runat=server Visible="false">' +
            '<div runat="server" id="ContentSubGroupHeader"></div>' +
            '</asp:PlaceHolder>' +
            '<asp:PlaceHolder runat="server" ID="PageTitleSection" Visible="false">' +
            '<div> <span id="PageTitle" runat="server" class="PageTitleHeader"></span> <span id="PageSubTitle" runat="server" class="PageSubTitleHeader" visible="False"></span> <span id="PageTitleLink" runat="server" class="PageSubTitleHeader" visible="False"></span> </div>' +
            '<div id="PageInstructions" runat="server" class="instructions"></div>' +
            '</asp:PlaceHolder>');
                
          //Add back in the aspx stylesheet link - grunt for some reason strips out the id, runat, etc
          $('link[href="style.css"]').replaceWith('<link rel="stylesheet" href="" id="MainStyle" runat="server">');

        }
        },
        src: ['<%= config.dist %>/*.aspx']
      }
    },
    
    //Create Print Logo task
    create_print_logo: {
      default: {
        options: {
          src: '<%= config.app %>/images/logo.png',
          dest: '.tmp/images/logo-print.jpg',
          //Color that white pixels will be replaced with - Must be in hex form (beginning with "0x" followed by hex number)
          fill_color: 0x000000,
          //Color threshold is the minimum color value it will look for to replace
          color_threshold: 0xEFEFEF
        }
      }
    },

    includes: {
      files: {
        src: ['.tmp/*.html'], // Source files 
        dest: '.tmp', // Destination directory 
        flatten: true,
        cwd: '.',
        options: {
          includeRegexp: /\{\{\s*?include\s*?"(\S+)"\s*?\}\}/
        }
      }
    }

  });

  grunt.registerTask('serve', 'start the server and preview your app, --allow-remote for remote access', function (target) {
    if (grunt.option('allow-remote')) {
      grunt.config.set('connect.options.hostname', '0.0.0.0');
    }
    if (target === 'dist') {
      return grunt.task.run(['build', 'connect:dist:keepalive']);
    }

    grunt.task.run([
      'build_pieces',
      'connect',
      'watch'
    ]);
  });

  grunt.registerTask('build_pieces', [
    'clean:tmp',
    'less',
		'jshint',
		'copy:tmp',
		'includes',
    'clean:includes',
    'useminPrepare',
		'concat',
		'cssmin:dist',
		'uglify',
		'usemin',
    'pixrem',
		'postcss',
		'create_print_logo'
	]);

  grunt.registerTask('build', [
    'clean:dist',
    'build_pieces',
    'accessibility',
    'copy:tmpToDist',
    'copy:htmlToaspx',
    'dom_munger',
    'replace',
    'failCheck',
    'clean:distHtml'
  ]);

  grunt.registerTask('default', [
    'build'
  ]);
  
  grunt.registerTask('test', [
    'serve',
  ]);
};