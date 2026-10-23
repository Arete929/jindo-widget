# 제3자 프로그램 고지

영상 내려받기(도구상자)는 아래 오픈소스 프로그램을 설치 파일에 함께 담아 사용합니다.
앱은 이 프로그램들을 수정하지 않고, 별도의 실행 파일로 불러 씁니다.

| 프로그램 | 쓰임 | 라이선스 | 출처 |
|---|---|---|---|
| yt-dlp | 영상·소리 내려받기 | Unlicense (퍼블릭 도메인) | https://github.com/yt-dlp/yt-dlp |
| FFmpeg (LGPL 빌드) | 영상과 소리를 합쳐 MP4 로 저장 | LGPL v2.1+ | https://ffmpeg.org · 빌드: https://github.com/BtbN/FFmpeg-Builds |

* FFmpeg 는 LGPL 빌드(shared)를 쓰며 `resources/vendor/ffmpeg/` 에 DLL 과 함께 들어 있습니다. 라이선스 전문은 같은 폴더의 `LICENSE.txt` 입니다.
* 빌드 전에 `node tools/fetch-vendor.js` 로 공식 릴리스를 받아 SHA-256 체크섬을 확인한 뒤 담습니다.
