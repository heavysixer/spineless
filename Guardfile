# A sample Guardfile
# More info at https://github.com/guard/guard#readme
guard "shell" do
  watch('spineless.js') { `rocco -l js spineless.js && mv ./spineless.html ./docs/index.html` }
end