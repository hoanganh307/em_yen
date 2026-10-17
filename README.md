# Chỉ dành riêng cho em — Galaxy Hải Yến

## Chạy trên máy

Cài Node.js từ 22.13 trở lên, giải nén/mở thư mục này trong VS Code.
Mở Terminal và chạy:

```bash
npm ci
npm run dev
```

Mở http://localhost:5173 (hoặc cổng Terminal in ra). Để thêm, thay và xóa ảnh
trên bản chạy tại máy, mở http://localhost:5173/signin-with-chatgpt?return_to=/
để dùng đăng nhập mô phỏng. Không cần đăng nhập tài khoản thật trong bước này.
Dừng trang bằng Ctrl+C trong Terminal.

Windows: sau khi cài Node.js, có thể mở CHAY_WEB_WINDOWS.bat.
Lần đầu cần Internet để tải thư viện. Đây là dự án React + TypeScript + CSS có
API, không phải một file HTML mở bằng cách bấm đúp.

## Trải nghiệm

1. Màn đen, câu “Em có muốn cùng anh đi xem sự đặc biệt này không?” hiện từng ký tự. Chỉ khi câu hoàn tất, nút “Có” mới xuất hiện, không có ngôi sao.
2. Chọn “Có”: mở Hệ Mặt Trời. Hiện câu “Hãy chỉ cho anh biết nơi em muốn khám phá trong các hành tinh này, rồi bấm vào đó.”
3. Chạm bất kỳ hành tinh nào: màn hình đen và gõ “Mình cùng đi khám phá nhé.”
4. Sau câu xuất phát, gõ câu hỏi “Theo em thì ở đâu là nơi đặc biệt nhất?”
5. Gõ lời đáp “Đối với anh, ở đâu cũng vậy, em luôn là người đặc biệt nhất.” và tiếp tục “Em luôn xứng đáng với những điều tốt đẹp.” Không xen ảnh giữa các câu.
6. Gõ “Yêu em”, phóng chữ lên gần hết chiều ngang màn hình rồi vỡ thành sao băng. Các tia sáng bay ra và hội tụ về vị trí quả cầu sao.
7. Bấm quả cầu để camera lao xuyên qua lớp sao, đi từ ngoài vào giữa quả cầu trong khoảng 2,8 giây. Tất cả ảnh đã có sẵn xung quanh camera, không cần mở khóa bằng góc xoay.
8. Kéo ngang/dọc để nhìn quanh không gian 360° và thấy các ảnh ở những hướng khác nhau. Phím mũi tên cũng điều khiển được góc nhìn. Sao và dải sáng nền di chuyển cùng camera; phần phía sau camera được ẩn đúng phối cảnh.
9. Ảnh rõ, chỉ làm mềm sát mép. Chạm một lần mở lớn ảnh ở giữa màn hình; chạm lại mở thư. Nút quay lại từ ảnh về không gian sao, từ không gian sao bay ngược ra quả cầu, rồi về Hệ Mặt Trời.
10. Biểu tượng bánh răng nhỏ quản lý thêm/thay/xóa ảnh và nhạc. Nhạc lặp liên tục qua cảnh bên ngoài và bên trong quả cầu.

Các cảnh chữ chỉ chuyển sau khi gõ hết câu và giữ đủ thời gian đọc. Chuyển tab sẽ tạm dừng tiến trình, không bỏ qua câu hoặc chuyển cảnh.

Không có dòng hướng dẫn cuộn hoặc xoay trên giao diện. Các thao tác xoay/zoom vẫn hoạt động.

## Nhạc nền

Trang dùng phần tử audio, không có iframe YouTube và không hiện video.
Nút “Có” chuẩn bị âm thanh ở trạng thái im lặng. Sau khi đọc lời nhắn và chuyển cảnh
xong, thiên hà xuất hiện thì nhạc mới bật tiếng và chạy lại từ đầu. Tệp nhạc lặp
liên tục, có nút tắt/bật nhỏ. Nếu trình duyệt chặn, bấm nút nhạc để phát lại.


Tệp mặc định hiện có dài 38,74 giây, lấy từ video người dùng đã gửi trước đó.
Gói nguồn không chứa âm thanh đầy đủ của video YouTube. Để dùng bản đầy đủ, mở
bánh răng → “Nhạc nền”, chọn MP3/M4A và lưu. Tệp tải lên được lưu trên máy chủ của
trang, lần mở sau vẫn dùng tệp đó. Bản tại máy và trang online có kho lưu riêng.

## Các file chính

| Muốn sửa | File |
| --- | --- |
| Giao diện, câu chữ | app/galaxy.tsx |
| Màu sắc, bố cục, chữ | app/globals.css |
| Điều khiển cảnh và chuyển cảnh | lib/scene.ts, lib/journey.ts |
| Chữ kiểu điện ảnh và lời nhắn | app/cinematic-text.tsx, app/story-sequence.tsx |
| Chữ Yêu em lớn dần, vỡ thành sao băng | app/love-bloom.tsx, lib/love-bloom.ts |
| Sao, quầng sáng và dải sáng nền | lib/star-renderer.ts |
| Bố trí ảnh trên hình cầu, tránh ảnh chồng và phân bố sao và phân bố sao | lib/galaxy-layout.mjs |
| Khung hình ngang/dọc | lib/scene-framing.mjs |
| Thông số quỹ đạo, chu kỳ | lib/solar-math.mjs |
| Vẽ bề mặt, ánh sáng, vành đai | lib/solar-renderer.ts |
| Lời chúc ban đầu | lib/wishes.ts |
| Thêm, thay, xóa ảnh | app/photo-editor.tsx, lib/photo-store.ts |
| Nhạc lặp | lib/use-music.ts |
| Ảnh, nhạc, phông tiếng Việt | public/assets/ |

## Dữ liệu ảnh

Gói nguồn kèm 13 ảnh và tệp nhạc mặc định khoảng 39 giây. Ảnh tải thêm lên trang online không nằm
trong gói nguồn. Khi chạy tại máy, Miniflare lưu dữ liệu trong thư mục .wrangler/;
không xóa thư mục này nếu muốn giữ ảnh đã thêm và các trạng thái đã xóa.
Bản tại máy và trang online có kho dữ liệu riêng.

Xóa ảnh được lưu trên máy chủ bằng một bản ghi đánh dấu, đồng thời xóa tệp tải
lên tương ứng. Ảnh có sẵn bị gỡ khỏi danh sách và không tự quay lại khi tải trang;
các tệp ảnh gốc trong mã nguồn vẫn tồn tại trong public/assets/.

## Mô phỏng Hệ Mặt Trời

Chu kỳ quỹ đạo, độ lệch tâm, độ nghiêng và hướng tự quay tham chiếu
[NASA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/).
Quỹ đạo dùng phương trình Kepler; Mặt Trăng quay quanh Trái Đất. Tốc độ mô phỏng
là 3 ngày mỗi giây, nên các hành tinh xa Mặt Trời di chuyển chậm hơn rõ rệt.
Vị trí ban đầu dùng để bố cục cảnh, không phải vị trí thiên văn của hôm nay.
Kích thước, khoảng cách và tốc độ tự quay được điều chỉnh để dễ quan sát;
đây không phải mô hình theo đúng tỷ lệ vật lý hay mô phỏng lực hấp dẫn N vật thể.

## Kiểm tra và bản dựng

```bash
npm test
npm run build
```

Các kiểm tra gồm xóa ảnh qua nhiều lần đọc lại, xóa hết rồi thêm mới, quỹ đạo,
phối cảnh không gian ảnh ở 8 kích thước màn hình qua nhiều góc xoay, luồng chọn cả 8 hành tinh, thứ tự lời nhắn không xen ảnh, camera bay vào quả cầu, mọi ảnh có sẵn và xem được bằng cách xoay 360°, ảnh rõ với kích thước hiển thị thật, chọn ảnh ra giữa/mở thư/quay lại và chuyển cảnh bằng mô hình DOM.
Không thay thế việc xem trực tiếp trên điện thoại thật.

Phần máy chủ dùng Cloudflare Workers + R2 với binding BUCKET. Nếu đưa lên nền
máy chủ khác, cần thay phần lưu trữ và đăng nhập tương ứng.

## Nguồn bản đồ bề mặt hành tinh

Bản đồ bề mặt của Solar System Scope / INOVE, theo CC BY 4.0.
Nguồn: https://www.solarsystemscope.com/textures/
Giấy phép: https://creativecommons.org/licenses/by/4.0/
Tệp 2K được giữ nguyên; trang lấy mẫu và tô sáng lên mô hình cầu khi hiển thị.
Màu sắc có điều chỉnh và một số khoảng trống được bổ sung trong bản đồ nguồn,
không phải bản đo khoa học. Xem public/assets/planets/ATTRIBUTION.txt.
