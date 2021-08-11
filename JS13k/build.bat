rem SIMPLE BUILD SCRIPT FOR JS13k by FRANK FORCE
rem minfies and combines index.html and index.js and zips the result

rem install closure and advzip globally if necessary
rem npm install -g google-closure-compiler
rem npm install -g advzip-bin

rem remove old files
del index.zip
del index.min.html
rmdir /s /q build

rem run google closure compiler
google-closure-compiler --js index.js --externs externs.js --js_output_file build\index.js --compilation_level ADVANCED --language_out ECMASCRIPT_2019 --warning_level VERBOSE --jscomp_off * | more

rem remove script tag
findstr /v "index.js" index.html > build\index.html

rem insert the html
echo ^<script^> >> build\index.html
type build\index.js >> build\index.html
echo ^</script^> >> build\index.html

rem zip the result
cd build
advzip -a -4 -i 99 index.zip index.html | more

rem copy zip and remove build folder
copy index.zip ..\index.zip
copy index.html ..\index.min.html
cd ..
rmdir /s /q build

rem pause to see result
rem pause