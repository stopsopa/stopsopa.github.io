
# run this command:
# /bin/bash bash/cli/yt-to-mp3/bulk.sh | tee log.log

rush --version 1> /dev/null 2> /dev/null

if [[ "${?}" != "0" ]]; then

  echo "${0} error: rush is not installed";

  exit 1
fi

_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"

/bin/bash "${_DIR}/test.sh"
if [[ "${?}" != "0" ]]; then
    exit 1
fi

if [ ! -f "${_DIR}/.env" ]; then

    echo "${0} error: .env file not found"

    exit 1
fi

cd "${_DIR}"

# use command
# yt-dlp --flat-playlist --skip-download --dump-json "https://www.youtube.com/playlist?list=PLevh6iJsj6uUg6KJtFjyu0hiyHJ9UsQwm" | jq -r '.id'
# to extract ids

LIST="$(cat <<-EOF
S0A9dNsLRjc
l6M14GJthlQ
gB-l1ijtRoo
s4iLX7eWwmE
4qFyRjeveaQ
J5x1GHIm7u4
AY9VI2B71bk
BnnbP7pCIvQ
xTW32xSn3vQ
RrMHQWk32hk
vSRzCOEnY4Q
9e-AeRiDEBw
w7jkJjCbens
pdZjvjUUqkc
hqlhukO0HNE
Y1re69G9hkM
8jaBEyMhCcA
Eyjj8BgsBGU
aeeJhEpeUfc
QSaNFXeYeyc
low6Coqrw9Y
dgkvpHg3jVk
IqfMWQmb4uw
-jXioxhRaGA
zXXwppNGFT8
5xFbpf2pVeI
ovWFEOqrkBI
68JpPpSc7bs
hji4gBuOvIQ
C-yP9f0gadU
oNjQXmoxiQ8
TogC7bus8JM
-5KpLRWY8sA
EBg1LvYM1Co
T_7cVKNHRhA
LG9RQS76zGc
66q9A51Bug4
VW5abTdVVu8
htgr3pvBr-I
gVqrx8JkwJ0
WHe5WQfuo5U
hb5elvP4B8s
JrCeoDajPR0
AmHRaWJ4A-s
LRSeDLtMq1k
o_QTaUuU8F4
-pYWMFSJX0g
-nC5TBv3sfU
wgqU5s8qJ04
Fi-tO27joa4
L_fmbEbyBzg
aWJi-s100No
RuYgbCul__s
Jmnp0xV2P3E
YgK0uRR5jGY
6gWXe6Am73E
2bA2Gnac9OY
U3-n3TMzL6o
cJK3U5kNpQM
JuR7GCboF_E
W7lGlowBj54
GYHMescFYiI
abETp8Q6H8U
rwC1f5J3Tcg
Gp6EMep8mzI
IRr98d-L3zQ
ua33ffcq8n0
_HzoUpTq77s
ipkEEwIszvM
Z4A5HwMOfW8
KJoYBw5tJOc
I7HahVwYpwo
pL3yuBmF0ms
qFLhGq0060w
M97vR2V4vTs
X4vxXQRTT8U
EX2n2ftbdZU
WRcH4NQgOc0
jtMHsNhQBvI
_2BuzT5IMAo
Um7pMggPnug
7jTq2FXKr0g
w4flBb-LbNs
zo3F3xWTyo8
dzFkOZIrafs
mHAkrp6Wuqg
UrHvJi1MIUA
F0odNLm6N5Q
ZlS37832o2M
1zlIPDbpX0I
oN2Xs-MvxLw
2KYnvMTAp3M
TNy3944jdCo
etZD_WfEmkI
MhlM9LMKKRw
htfNwGkj3o4
S010hhJw3bY
SYfxevM_dTY
mJ1-jJPztto
9NzlDUeS1U4
wL8DVHuWI7Y
RknU-JwdmFk
BF2YptBFVlo
q8ir8rVl2Z4
6u_EWKVRoxc
k20NwCro8ig
YVGt8pyqXXY
fqh7N_4FZDw
Ql1k7YirQlU
QsM87FFBpeQ
eIRQQjVYQ78
R0GJVJftchg
OESoESpY5Ro
3VN-tAddpw4
_p2NvO6KrBs
5ve67v5RweQ
X-WQqy2gNJQ
EOF
)"

TOTAL="$(echo "${LIST}" | wc -l | tr -d ' ')"

echo "${LIST}" | rush -j 3 /bin/bash "${_DIR}/index.sh" '{}' {#} "${TOTAL}"







