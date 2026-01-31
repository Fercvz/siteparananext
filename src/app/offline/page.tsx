export default function OfflinePage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f3f4f6] p-6">
      <div className="max-w-md w-full rounded-2xl bg-white p-6 shadow-md text-center">
        <div className="text-3xl mb-3">📡</div>
        <h1 className="text-xl font-semibold text-gray-900">Você está offline</h1>
        <p className="mt-2 text-sm text-gray-600">
          Conecte-se à internet para acessar o sistema com segurança.
        </p>
      </div>
    </div>
  );
}
