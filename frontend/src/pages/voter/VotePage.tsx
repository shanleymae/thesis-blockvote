import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart2, Radio } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BrowserProvider, Contract } from 'ethers';
import Sidebar from '../../components/layout/Sidebar';
import CandidateCard from '../../components/shared/CandidateCard';
import ResultsChart from '../../components/shared/ResultsChart';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import {
  electionGroupsApi,
  resultsApi,
  votesApi,
  type Candidate,
  type ElectionGroupDetail,
  type ElectionPosition,
  type ElectionResults,
} from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { notifyError, notifyInfo, notifySuccess } from '../../lib/toast';
import { subscribeToElectionResults } from '../../lib/resultsSocket';

const MetaMaskIcon = () => (
  <svg width="18" height="18" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M36.2 3L21.9 13.4l2.7-6.3L36.2 3z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.8 3l14.2 10.5-2.6-6.4L3.8 3z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M30.9 28.4l-3.8 5.8 8.1 2.2 2.3-7.9-6.6-.1zM2.6 28.5l2.3 7.9 8.1-2.2-3.8-5.8-6.6.1z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12.5 17.8l-2.3 3.4 8.1.4-.3-8.7-5.5 4.9zM27.5 17.8l-5.6-5-2.3 8.7 8.1-.4-2.2-3.3z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type PendingVote = {
  position: ElectionPosition;
  candidate: Candidate;
};

const EXPECTED_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID ?? '11155111');
const EXPECTED_CHAIN_HEX = `0x${EXPECTED_CHAIN_ID.toString(16)}`;
const EXPECTED_CHAIN_NAME = EXPECTED_CHAIN_ID === 11155111 ? 'Sepolia' : `chain ${EXPECTED_CHAIN_ID}`;

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function getVoteErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const code = typeof error === 'object' && error != null && 'code' in error ? String((error as { code?: unknown }).code) : '';
  if (code === 'BAD_DATA' || message.includes('could not decode result data')) {
    return `Could not read the voting contract. Please switch MetaMask to ${EXPECTED_CHAIN_NAME} and try again.`;
  }
  return message;
}

async function switchToExpectedChain() {
  await (window as any).ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: EXPECTED_CHAIN_HEX }],
  });
}

async function addExpectedChain() {
  if (EXPECTED_CHAIN_ID !== 11155111) return;
  await (window as any).ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [
      {
        chainId: EXPECTED_CHAIN_HEX,
        chainName: 'Sepolia',
        nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
      },
    ],
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const VotePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState<ElectionGroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [votedByElectionId, setVotedByElectionId] = useState<Record<string, string>>({});
  const [confirmVote, setConfirmVote] = useState<PendingVote | null>(null);
  const [selectedResultsElectionId, setSelectedResultsElectionId] = useState<string | null>(null);
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setPageError(null);
    electionGroupsApi
      .getById(id)
      .then((data) => {
        setGroup(data);
        setSelectedResultsElectionId((current) => current ?? data.positions[0]?.id ?? null);
      })
      .catch((e) => setPageError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const checkVoted = async () => {
      if (!group) return;
      try {
        const my = await votesApi.myVotes();
        const next: Record<string, string> = {};
        for (const vote of my) {
          const belongsToGroup = group.positions.some((position) => position.id === vote.election.id);
          if (belongsToGroup) next[vote.election.id] = vote.candidate.id;
        }
        setVotedByElectionId(next);
      } catch {
        // ignore; dashboard already surfaces errors
      }
    };
    checkVoted();
  }, [group]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedResultsPosition = useMemo(() => {
    if (!group) return null;
    return group.positions.find((position) => position.id === selectedResultsElectionId) ?? group.positions[0] ?? null;
  }, [group, selectedResultsElectionId]);

  useEffect(() => {
    if (!selectedResultsPosition) return;

    let cancelled = false;

    const fetchResults = async () => {
      try {
        setResultsLoading(true);
        setResultsError(null);
        const data = await resultsApi.getElectionResults(selectedResultsPosition.id);
        if (!cancelled) setResults(data);
      } catch (e) {
        if (!cancelled) setResultsError((e as Error).message);
      } finally {
        if (!cancelled) setResultsLoading(false);
      }
    };

    fetchResults();
    const unsubscribe = subscribeToElectionResults(selectedResultsPosition.id, (data) => {
      if (!cancelled) {
        setResults(data);
        setResultsError(null);
        setResultsLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [selectedResultsPosition]);

  const countdownLabel = (() => {
    if (!group) return null;
    if (group.status === 'UPCOMING') {
      const start = new Date(group.startDate).getTime();
      const diff = start - now;
      if (diff <= 0) return 'Voting opens soon';
      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / (24 * 3600));
      const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s until voting opens`;
      if (hours > 0) return `${hours}h ${minutes}m ${seconds}s until voting opens`;
      if (minutes > 0) return `${minutes}m ${seconds}s until voting opens`;
      return `${seconds}s until voting opens`;
    }

    const end = new Date(group.endDate).getTime();
    const diff = end - now;
    if (diff <= 0) return 'Voting window has ended';
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s remaining`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s remaining`;
    if (minutes > 0) return `${minutes}m ${seconds}s remaining`;
    return `${seconds}s remaining`;
  })();

  const isActive = group?.status === 'ACTIVE';
  const isUpcoming = group?.status === 'UPCOMING';
  const canAccessElection = !group || group.scope === 'GLOBAL' || group.organizationId === user?.organizationId;
  const statusMessage = isUpcoming
    ? 'This election is published early so you can review positions and candidates before voting opens.'
    : group?.status === 'CLOSED'
      ? 'This election is already closed. You can still review candidates and results.'
      : null;

  const handleOpenConfirm = (position: ElectionPosition, candidate: Candidate) => {
    if (votedByElectionId[position.id]) {
      notifyError(`You have already voted for ${position.positionTitle ?? position.title}.`);
      return;
    }
    if (!isActive) {
      notifyError('Voting is only available once the election becomes active.');
      return;
    }
    setConfirmVote({ position, candidate });
  };

  const handleCastVote = async ({ position, candidate }: PendingVote) => {
    if (!id || !group) return;
    if (group.status !== 'ACTIVE') {
      notifyError('Voting is only available once the election becomes active.');
      return;
    }
    if (votedByElectionId[position.id]) {
      notifyError(`You have already voted for ${position.positionTitle ?? position.title}.`);
      return;
    }
    if (!user?.walletAddress) {
      notifyError('You must link a wallet in your profile before voting.');
      return;
    }
    const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined;
    if (!contractAddress) {
      notifyError('Contract address is not configured on the frontend.');
      return;
    }
    if (!(window as any).ethereum) {
      notifyError('MetaMask (or another Web3 wallet) is required to vote.');
      return;
    }

    setSubmitting(true);
    try {
      let provider = new BrowserProvider((window as any).ethereum);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== EXPECTED_CHAIN_ID) {
        try {
          await switchToExpectedChain();
        } catch (switchError) {
          const switchCode =
            typeof switchError === 'object' && switchError != null && 'code' in switchError
              ? Number((switchError as { code?: unknown }).code)
              : null;
          if (switchCode === 4902) {
            await addExpectedChain();
            await switchToExpectedChain();
          } else {
            notifyError(`Please switch MetaMask to ${EXPECTED_CHAIN_NAME} before voting.`);
            return;
          }
        }
        provider = new BrowserProvider((window as any).ethereum);
      }

      const deployedCode = await provider.getCode(contractAddress);
      if (deployedCode === '0x') {
        notifyError(`Voting contract was not found on ${EXPECTED_CHAIN_NAME}. Please contact admin.`);
        return;
      }

      const signer = await provider.getSigner();
      const abi = [
        'function castVote(uint256 _electionId, uint256 _candidateId) external',
        'function hasVoted(address _voter, uint256 _electionId) external view returns (bool)',
        'function getTotalElections() view returns (uint256)',
        'function getElection(uint256 _electionId) view returns (uint256 id, string title, string description, uint256 startTime, uint256 endTime, uint8 status, uint256 candidateCount, uint256 totalVotes)',
        'function candidates(uint256, uint256) view returns (uint256 id, string name, string description, uint256 electionId, uint256 voteCount, bool exists)',
      ];
      const contract = new Contract(contractAddress, abi, signer);

      let resolvedElectionId = position.contractElectionId;
      let resolvedCandidateId = candidate.contractCandidateId;

      if (resolvedElectionId == null) {
        const total = Number(await contract.getTotalElections());
        const targetTitle = normalizeText(position.title);
        for (let i = 1; i <= total; i += 1) {
          const chainElection = await contract.getElection(i);
          const chainTitle = normalizeText(String(chainElection.title ?? ''));
          if (chainTitle === targetTitle) {
            resolvedElectionId = i;
            break;
          }
        }
      }

      if (resolvedElectionId != null && resolvedCandidateId == null) {
        const chainElection = await contract.getElection(resolvedElectionId);
        const chainCandidateCount = Number(chainElection.candidateCount ?? 0);
        const targetCandidateName = normalizeText(candidate.name);
        for (let j = 1; j <= chainCandidateCount; j += 1) {
          const chainCandidate = await contract.candidates(resolvedElectionId, j);
          const exists = Boolean(chainCandidate.exists);
          const chainName = normalizeText(String(chainCandidate.name ?? ''));
          if (exists && chainName === targetCandidateName) {
            resolvedCandidateId = j;
            break;
          }
        }
      }

      if (resolvedElectionId == null || resolvedCandidateId == null) {
        notifyError('This position is not fully synced on-chain yet. Please contact admin.');
        return;
      }

      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== user.walletAddress.toLowerCase()) {
        notifyError('Your active MetaMask account does not match the wallet linked to this account.');
        return;
      }

      const preparedVote = await votesApi.prepareVote();
      if (preparedVote.walletAddress.toLowerCase() !== signerAddress.toLowerCase()) {
        notifyError('The approved wallet on your account does not match your active MetaMask account.');
        return;
      }

      const alreadyVotedOnChain = await contract.hasVoted(signerAddress, resolvedElectionId);
      if (alreadyVotedOnChain) {
        setVotedByElectionId((current) => ({ ...current, [position.id]: candidate.id }));
        notifyError(`This wallet has already voted for ${position.positionTitle ?? position.title}.`);
        return;
      }

      notifyInfo('Confirm the vote in your wallet.');
      const tx = await contract.castVote(resolvedElectionId, resolvedCandidateId);
      await tx.wait();
      try {
        await votesApi.recordVote({ electionId: position.id, candidateId: candidate.id, txHash: tx.hash });
      } catch (e) {
        notifyError(`The vote was confirmed on-chain, but saving the receipt failed: ${(e as Error).message}`);
      }

      setVotedByElectionId((current) => ({ ...current, [position.id]: candidate.id }));
      setConfirmVote(null);
      notifySuccess('Vote cast successfully.');

      navigate(`/voter/receipt?tx=${encodeURIComponent(tx.hash)}`, {
        state: {
          election: group.title,
          position: position.positionTitle ?? position.title,
          candidate: candidate.name,
          wallet: signerAddress,
          txHash: tx.hash,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (e) {
      notifyError(getVoteErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bv-bg flex">
      <Sidebar variant="voter" />

      <main className="ml-56 flex-1 overflow-y-auto px-10 py-8">
        {loading && <p className="text-bv-ink-muted">Loading election...</p>}
        {!loading && pageError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {pageError}
          </div>
        )}
        {!loading && group && canAccessElection && (
          <>
            <div className="mb-8 flex items-center gap-4 border-b border-white/10 pb-5">
              <Link to="/voter/elections" className="flex items-center gap-1.5 text-bv-ink-secondary hover:text-bv-ink transition-colors text-sm">
                <ArrowLeft size={16} />
                Back
              </Link>
              <div className="h-4 w-px bg-white/15" />
              <div>
                <h1 className="text-2xl font-semibold text-bv-ink">{group.title}</h1>
                {countdownLabel && <p className="text-bv-ink-secondary text-xs mt-1">{countdownLabel}</p>}
              </div>
            </div>

            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-bv-ink-secondary">{group.description}</p>

            <div className="mb-6 flex flex-wrap gap-3 text-sm text-bv-ink-secondary">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                Start: {formatDateTime(group.startDate)}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                End: {formatDateTime(group.endDate)}
              </span>
            </div>

            {statusMessage && (
              <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-bv-ink-secondary">
                {statusMessage}
              </div>
            )}

            <section className="space-y-7">
              {group.positions.map((position, index) => {
                const votedCandidateId = votedByElectionId[position.id] ?? null;
                return (
                  <div key={position.id} className="border-b border-white/10 pb-7 last:border-b-0">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-bv-ink-muted">Position {index + 1}</p>
                        <h2 className="mt-1 text-lg font-semibold text-bv-ink">{position.positionTitle ?? position.title}</h2>
                      </div>
                      {votedCandidateId && (
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-bv-ink-secondary">
                          Vote submitted
                        </span>
                      )}
                    </div>

                    {votedCandidateId && (
                      <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-bv-ink-secondary">
                        Vote submitted for{' '}
                        <strong className="text-bv-ink">
                          {position.candidates.find((c) => c.id === votedCandidateId)?.name ?? 'selected candidate'}
                        </strong>
                        .
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {position.candidates.map((candidate) => (
                        <CandidateCard
                          key={candidate.id}
                          {...candidate}
                          size="compact"
                          selected={votedCandidateId === candidate.id}
                          onSelect={() => handleOpenConfirm(position, candidate)}
                          disabled={Boolean(votedCandidateId) || !isActive}
                          profileHref={`/elections/${position.id}/candidates/${candidate.id}`}
                          voteLabel={isUpcoming ? 'Voting Opens Soon' : group.status === 'CLOSED' ? 'Voting Closed' : 'Cast Vote'}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="mt-8">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-bv-ink">
                  <BarChart2 size={18} className="text-bv-ink-secondary" />
                  Live Results
                </h2>
                <div className="flex flex-wrap gap-2">
                  {group.positions.map((position) => (
                    <button
                      key={position.id}
                      type="button"
                      onClick={() => setSelectedResultsElectionId(position.id)}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                        selectedResultsPosition?.id === position.id
                          ? 'border-bv-accent bg-bv-accent text-bv-bg'
                          : 'border-white/10 text-bv-ink-secondary hover:text-bv-ink'
                      }`}
                    >
                      {position.positionTitle ?? position.title}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-bv-ink-secondary">
                  <Radio size={12} />
                  Live tally for {selectedResultsPosition?.positionTitle ?? selectedResultsPosition?.title ?? 'selected position'}
                </div>
                <ResultsChart
                  candidates={results?.candidates ?? []}
                  winner={results?.winner ?? null}
                  totalVotes={results?.totalVotes ?? 0}
                  loading={resultsLoading}
                  error={resultsError}
                />
              </div>
            </section>
          </>
        )}
        {!loading && group && !canAccessElection && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-bv-ink-secondary">
            This election is restricted to another organization.
          </div>
        )}
      </main>

      {confirmVote && (
        <Modal title="Confirm your vote" onClose={() => setConfirmVote(null)} className="max-w-xl">
          <p className="text-sm text-bv-ink-secondary">
            You are about to cast your vote for{' '}
            <strong className="text-bv-ink">{confirmVote.candidate.name}</strong>
            {' '}as{' '}
            <strong className="text-bv-ink">{confirmVote.position.positionTitle ?? confirmVote.position.title}</strong>.
            This action is final and cannot be changed.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-bv-ink-secondary">
            <MetaMaskIcon />
            <span>You will confirm the transaction in your wallet.</span>
          </div>
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="outline" fullWidth disabled={submitting} onClick={() => setConfirmVote(null)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" fullWidth disabled={submitting} onClick={() => void handleCastVote(confirmVote)}>
              {submitting ? 'Casting vote...' : 'Confirm and Cast Vote'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default VotePage;
