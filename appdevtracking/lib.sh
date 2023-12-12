declare baseurl="https://groups.community.sap.com/api/2.0"
declare here="$(dirname "$0")"
declare scriptname="$(basename "$0")"
declare nowepochms="$(date +%s%N | cut -b1-13)"

export PATH="$PATH:$here"

log() {

  echo "$*" >> "$scriptname.log"

}

die() {

  echo "$*"
  exit 1 

}
