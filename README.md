paintover
=========

## 설치 & 개발방법

* [`node.js`](http://nodejs.org/)를 설치한다.
* `$ npm install -g bower` (windows 사용자는 `$ npm install bower`)
* `bower install` 로 디펜던시 설치
* 크롬 주소창에 `chrome://extensions/` 입력
* `Developer mode` 체크
* `Load unpacked extensions...` 을 선택하고 프로젝트 선택

## 빌드방법

### zip

`chrome web store`에 업로드 하기위한 파일

* `$ npm install` 로 dependency 설치
* `$ grunt build:dist` 실행
* `package/` 디렉토리에 생셩된 파일 확인

### crx

소스를 직접 로드하지 않고 배포하고자 하기위한 파일

* `$ npm install -g crx` 로 `crx` 설치
* `$ mkdir cert && crx keygen cert/` 로 private key 생성
* `$ npm install` 로 dependency 설치
* `$ grunt build:crx` 실행
* `package/` 디렉토리에 생셩된 파일 확인

> only tested on `OS X`

### all

`$ grunt` 또는 `$ grunt build` 로 `zip`, `crx` 모두 빌드할 수 있다.
