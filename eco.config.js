module.exports = {
  apps: [
    {
      name: "app", // 애플리케이션 이름
      script: "npm", // 실행할 스크립트
      args: "start", // 스크립트 인자
      cwd: "./", // 현재 워킹 디렉토리
      instances: 1, // 인스턴스 수
      autorestart: true, // 자동 재시작
      watch: false, // 파일 변경 감지
      max_memory_restart: "1G", // 최대 메모리
      env: {
        NODE_ENV: "production",
        PORT: 10050, // 포트 번호
      },
    },
  ],
};
