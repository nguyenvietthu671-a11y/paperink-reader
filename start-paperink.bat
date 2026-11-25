@echo off
chcp 65001 >nul
cd /d "%~dp0"
title PaperInk Reader - PC Server

echo ======================================================================
echo   📖 PAPERINK READER - MÁY CHỦ SÁCH PC ĐÃ KHỞI ĐỘNG!
echo ======================================================================
echo   * Đang chia sẻ kho sách EPUB từ thư mục kindle máy tính...
echo   * Mở trên máy tính này:  http://localhost:3000
echo   * Mở trên điện thoại:    http://10.62.161.169:3000
echo   * Đồng bộ 2 chiều: Tiến độ, Highlight, Đánh giá, Nét vẽ S Pen.
echo ======================================================================
echo   (Hãy giữ cửa sổ này mở khi bạn muốn đọc sách Online trên điện thoại)
echo.

start "" http://localhost:3000
node server.js
pause
