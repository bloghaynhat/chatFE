import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context";

export const TermsPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            {t("terms.pageTitle")}
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-100 hover:text-white font-medium text-sm transition"
          >
            {t("terms.back")}
          </button>
        </div>

        <div className="p-6 sm:p-8 text-gray-700 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {t("terms.introTitle")}
            </h2>
            <p className="leading-relaxed">
              {t("terms.introContent")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {t("terms.rightsTitle")}
            </h2>
            <p className="leading-relaxed">
              {t("terms.rightsContent")}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {t("terms.privacyTitle")}
            </h2>
            <p className="leading-relaxed">
              {t("terms.privacyContent")}
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>{t("terms.privacyItem1")}</li>
              <li>{t("terms.privacyItem2")}</li>
              <li>{t("terms.privacyItem3")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {t("terms.commitmentTitle")}
            </h2>
            <p className="leading-relaxed">
              {t("terms.commitmentContent1")} <br />
              {t("terms.commitmentContent2")}
            </p>
          </section>

          <div className="pt-6 border-t border-gray-100 flex justify-center">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-6 rounded-lg transition"
            >
              {t("terms.understandAndBack")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
