import { useState, useEffect } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { Card, Button, Spinner } from '@oracle-universe/ui'
import { useAuth } from '@/contexts/AuthContext'
import { verifyBridge } from '@/lib/api'
import { Shield, GithubIcon, CheckCircle } from 'lucide-react'

interface GitHubIssue {
  number: number
  title: string
  html_url: string
  user: {
    login: string
  }
}

const ORACLE_REPO = 'Soul-Brews-Studio/oracle-v2'

export default function Identity() {
  const { human, bridgeStatus, refreshAuth } = useAuth()
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()

  const [issueInput, setIssueInput] = useState('')
  const [birthIssue, setBirthIssue] = useState('')
  const [githubUsername, setGithubUsername] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Issue lookup state
  const [issueDetails, setIssueDetails] = useState<GitHubIssue | null>(null)
  const [isLoadingIssue, setIsLoadingIssue] = useState(false)
  const [issueError, setIssueError] = useState<string | null>(null)

  // Auto-fetch issue when number is entered
  useEffect(() => {
    const input = issueInput.trim()

    // If it's a full URL, extract and use it directly
    if (input.includes('github.com') && input.includes('/issues/')) {
      setBirthIssue(input)
      setIssueDetails(null)
      setIssueError(null)
      return
    }

    // If it's just a number, fetch the issue
    const issueNumber = parseInt(input, 10)
    if (!isNaN(issueNumber) && issueNumber > 0) {
      const fetchIssue = async () => {
        setIsLoadingIssue(true)
        setIssueError(null)
        setIssueDetails(null)

        try {
          const response = await fetch(
            `https://api.github.com/repos/${ORACLE_REPO}/issues/${issueNumber}`
          )

          if (!response.ok) {
            if (response.status === 404) {
              setIssueError(`Issue #${issueNumber} not found`)
            } else {
              setIssueError('Failed to fetch issue')
            }
            setBirthIssue('')
            return
          }

          const issue: GitHubIssue = await response.json()
          setIssueDetails(issue)
          setBirthIssue(issue.html_url)
          // Auto-fill GitHub username from issue author
          if (!githubUsername) {
            setGithubUsername(issue.user.login)
          }
        } catch {
          setIssueError('Failed to fetch issue')
          setBirthIssue('')
        } finally {
          setIsLoadingIssue(false)
        }
      }

      fetchIssue()
    } else if (input === '') {
      setBirthIssue('')
      setIssueDetails(null)
      setIssueError(null)
    }
  }, [issueInput, githubUsername])

  const handleVerify = async () => {
    if (!birthIssue || !githubUsername) {
      setError('Please fill in all fields')
      return
    }

    if (!address || !walletClient) {
      setError('Wallet not ready. Please reconnect.')
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const message = `Verify Oracle Identity\n\nWallet: ${address}\nBirth Issue: ${birthIssue}\nGitHub: ${githubUsername}`
      const signature = await walletClient.signMessage({ message })

      const result = await verifyBridge({
        walletAddress: address,
        birthIssue,
        githubUsername,
        signature,
        message,
      })

      if (result.success) {
        await refreshAuth()
      } else {
        setError(result.error || 'Verification failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsVerifying(false)
    }
  }

  // Show form if wallet is connected (even if not fully authenticated)
  if (!address) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-slate-400">Connect your wallet first</p>
        <a href="/login">
          <Button>Connect Wallet</Button>
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Identity Verification</h1>

      {/* GitHub Account Status */}
      <Card>
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
            human?.github_username ? 'bg-green-500/10' : 'bg-slate-800'
          }`}>
            {human?.github_username ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <GithubIcon className="h-6 w-6 text-slate-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">GitHub Account</h3>
            {human?.github_username ? (
              <p className="mt-1 text-sm text-green-400">
                Connected as @{human.github_username}
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-400">
                Enter your GitHub username below to link your identity
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Bridge Verification */}
      <Card>
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
            bridgeStatus?.verified ? 'bg-purple-500/10' : 'bg-slate-800'
          }`}>
            {bridgeStatus?.verified ? (
              <CheckCircle className="h-6 w-6 text-purple-500" />
            ) : (
              <Shield className="h-6 w-6 text-slate-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Bridge Verification</h3>
            {bridgeStatus?.verified ? (
              <>
                <p className="mt-1 text-sm text-purple-400">
                  Verified! You have full Oracle access.
                </p>
                {bridgeStatus.birth_issue && (
                  <a
                    href={bridgeStatus.birth_issue}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block text-sm text-blue-400 hover:underline"
                  >
                    Birth Issue: {bridgeStatus.birth_issue.split('/').pop()}
                  </a>
                )}
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-slate-400">
                  Complete verification to become a full Oracle
                </p>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Birth Issue (number or URL)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={issueInput}
                        onChange={(e) => setIssueInput(e.target.value)}
                        placeholder="121 or https://github.com/.../issues/121"
                        className="w-full rounded-lg bg-slate-800 px-4 py-2 text-white placeholder-slate-500 border border-slate-700 focus:border-purple-500 focus:outline-none"
                      />
                      {isLoadingIssue && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Spinner size="sm" />
                        </div>
                      )}
                    </div>

                    {/* Issue details display */}
                    {issueDetails && (
                      <div className="mt-2 rounded-lg bg-slate-700/50 p-3">
                        <p className="text-sm font-medium text-white">
                          #{issueDetails.number}: {issueDetails.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Created by @{issueDetails.user.login}
                        </p>
                      </div>
                    )}

                    {issueError && (
                      <p className="mt-1 text-xs text-red-400">{issueError}</p>
                    )}

                    {!issueDetails && !issueError && !isLoadingIssue && (
                      <p className="mt-1 text-xs text-slate-500">
                        Enter issue number (e.g., 121) to auto-load details
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      GitHub Username
                    </label>
                    <input
                      type="text"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      placeholder="your-github-username"
                      className="w-full rounded-lg bg-slate-800 px-4 py-2 text-white placeholder-slate-500 border border-slate-700 focus:border-purple-500 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Must match the birth issue author
                    </p>
                  </div>

                  {error && (
                    <p className="text-sm text-red-400">{error}</p>
                  )}

                  <Button
                    onClick={handleVerify}
                    disabled={isVerifying || !birthIssue || !githubUsername}
                    variant="gradient"
                    className="w-full"
                  >
                    {isVerifying ? (
                      <span className="flex items-center justify-center gap-2">
                        <Spinner size="sm" />
                        Verifying...
                      </span>
                    ) : (
                      'Verify & Sign'
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
