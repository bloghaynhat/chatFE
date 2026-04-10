import React from "react";
import { useNavigate } from "react-router-dom";

export const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            Chính sách Điều khoản và Dịch vụ
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-100 hover:text-white font-medium text-sm transition"
          >
            Quay lại
          </button>
        </div>

        <div className="p-6 sm:p-8 text-gray-700 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              1. Giới thiệu
            </h2>
            <p className="leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              2. Quyền và Trách nhiệm
            </h2>
            <p className="leading-relaxed">
              Duis aute irure dolor in reprehenderit in voluptate velit esse
              cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
              cupidatat non proident, sunt in culpa qui officia deserunt mollit
              anim id est laborum. Lorem ipsum dolor sit amet, consectetur
              adipiscing elit. Integer nec odio. Praesent libero. Sed cursus
              ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum
              imperdiet.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              3. Bảo mật Thông tin
            </h2>
            <p className="leading-relaxed">
              Curabitur sodales ligula in libero. Sed dignissim lacinia nunc.
              Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque
              sem at dolor. Maecenas mattis. Sed convallis tristique sem. Proin
              ut ligula vel nunc egestas porttitor.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Phasellus consectetuer vestibulum elit.</li>
              <li>
                Aenean tellus metus, bibendum sed, posuere ac, mattis non, nunc.
              </li>
              <li>
                Vestibulum fringilla pede sit amet augue. In hac habitasse
                platea dictumst.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              4. Cam kết Người dùng
            </h2>
            <p className="leading-relaxed">
              Suspendisse ut metus. Nulla facilisi. Praesent commodo cursus
              magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus
              vel augue laoreet rutrum faucibus dolor auctor. <br />
              Cras mattis consectetur purus sit amet fermentum. Nullam id dolor
              id nibh ultricies vehicula ut id elit.
            </p>
          </section>

          <div className="pt-6 border-t border-gray-100 flex justify-center">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-6 rounded-lg transition"
            >
              Đã hiểu và Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
