#!/bin/sh -l

git_setup() {
  	cat <<- EOF > $HOME/.netrc
		machine github.com
		login $GITHUB_ACTOR
		password $GITHUB_TOKEN
		machine api.github.com
		login $GITHUB_ACTOR
		password $GITHUB_TOKEN
	EOF

	chmod 600 $HOME/.netrc

	git config --global user.email "$GITHUB_ACTOR@users.noreply.github.com"
	git config --global user.name "$GITHUB_ACTOR"
}

version=`cat VERSION`

git_setup
git remote update
git fetch --all

git stash

# Will create branch if it does not exist
if [[ $( git branch -r | grep "$INPUT_BRANCH" ) ]]; then
   git checkout "${INPUT_BRANCH}"
else
   git checkout -b "${INPUT_BRANCH}"
fi

git stash pop
git add .
git diff
git commit -m "[GA Build $GITHUB_RUN_NUMBER] 🔮 BUILD: Version $version" -m "Commit $GITHUB_SHA by $GITHUB_ACTOR" -m "Ref: $GITHUB_REF"
git push --force --set-upstream origin "${INPUT_BRANCH}"