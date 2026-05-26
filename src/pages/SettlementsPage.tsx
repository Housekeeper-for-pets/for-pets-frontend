import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMySettlements } from '../api';
import {
  settlementStatusLabels,
  settlementTypeLabels,
} from '../constants/options';
import type { Settlement } from '../types';

function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        const result = await getMySettlements();

        if (result.success) {
          setSettlements(result.data);
          setSelectedSettlement(result.data[0] ?? null);
          return;
        }

        setErrorMessage(result.error.message);
      } catch {
        setErrorMessage('정산 내역을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSettlements();
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold text-[#E26B4A]">SETTLEMENTS</p>
          <h1 className="mt-3 text-3xl font-bold text-[#2A2622]">정산 내역</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F675F]">
            케어 완료와 취소 패널티로 생성된 정산 금액과 처리 상태를 확인합니다.
          </p>
        </div>
        <span className="w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-[#6F675F] shadow-sm">
          {settlements.length}건
        </span>
      </section>

      {errorMessage && (
        <p className="mt-5 rounded-2xl bg-[#FFF0EA] px-4 py-3 text-sm font-medium text-[#B44727]">
          {errorMessage}
        </p>
      )}

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-4">
          {isLoading && (
            <p className="rounded-2xl bg-white p-5 text-sm text-[#6F675F] shadow-sm">
              정산 내역을 불러오는 중입니다.
            </p>
          )}

          {!isLoading && settlements.length === 0 && (
            <p className="rounded-2xl bg-white p-5 text-sm text-[#6F675F] shadow-sm">
              아직 정산 내역이 없습니다.
            </p>
          )}

          {settlements.map((settlement) => (
            <button
              key={settlement.settlementId}
              type="button"
              onClick={() => setSelectedSettlement(settlement)}
              className={[
                'rounded-2xl border p-5 text-left shadow-sm transition',
                selectedSettlement?.settlementId === settlement.settlementId
                  ? 'border-[#E26B4A] bg-[#FFF7F2]'
                  : 'border-[#E7DCD1] bg-white',
              ].join(' ')}
            >
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <p className="text-xs font-bold text-[#E26B4A]">
                    예약 #{settlement.reservationId}
                  </p>
                  <h2 className="mt-2 text-lg font-bold text-[#2A2622]">
                    {settlement.settlementAmount.toLocaleString()}원
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-[#6F675F]">
                    {settlementTypeLabels[settlement.settlementType]}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-[#F4E9DE] px-3 py-1 text-xs font-bold text-[#6F675F]">
                  {settlementStatusLabels[settlement.status]}
                </span>
              </div>
            </button>
          ))}
        </div>

        <aside className="rounded-2xl border border-[#E7DCD1] bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-[#E26B4A]">DETAIL</p>
          <h2 className="mt-3 text-xl font-bold text-[#2A2622]">정산 상세</h2>

          {selectedSettlement ? (
            <>
              <dl className="mt-5 grid gap-3">
                {[
                  ['정산 ID', selectedSettlement.settlementId],
                  ['예약 ID', selectedSettlement.reservationId],
                  ['수령 회원', selectedSettlement.receiverMemberId],
                  ['원 결제', selectedSettlement.sourcePaymentId],
                  ['원금', `${selectedSettlement.originalAmount.toLocaleString()}원`],
                  ['플랫폼 수수료', `${selectedSettlement.platformFeeAmount.toLocaleString()}원`],
                  ['정산 금액', `${selectedSettlement.settlementAmount.toLocaleString()}원`],
                  ['상태', settlementStatusLabels[selectedSettlement.status]],
                  ['사유', selectedSettlement.reason || '-'],
                  ['보류 사유', selectedSettlement.holdReason || '-'],
                  ['실패 사유', selectedSettlement.failedReason || '-'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-[#FAF6F1] p-4">
                    <dt className="text-xs font-bold text-[#9B8E82]">{label}</dt>
                    <dd className="mt-1 text-sm font-bold text-[#2A2622]">{value}</dd>
                  </div>
                ))}
              </dl>
              <Link
                to={`/reservations/${selectedSettlement.reservationId}`}
                className="mt-4 inline-flex w-full justify-center rounded-2xl bg-[#2A2622] px-4 py-3 text-sm font-bold text-white"
              >
                예약 보기
              </Link>
            </>
          ) : (
            <p className="mt-5 rounded-2xl bg-[#FAF6F1] p-4 text-sm text-[#6F675F]">
              확인할 정산을 선택해 주세요.
            </p>
          )}
        </aside>
      </section>
    </main>
  );
}

export default SettlementsPage;
