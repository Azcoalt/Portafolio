const GITHUB_USERNAME = 'Azcoalt';
export const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;
const GITHUB_REPOS_API = `https://api.github.com/users/${GITHUB_USERNAME}/repos?type=owner&sort=updated&per_page=100`;
const CACHE_KEY = 'azcoalt_github_repos_v1';
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Normalizes a repository homepage or GitHub Pages URL into a valid https/http URL.
 */
export function resolveWebsiteUrl(repo) {
  const rawHomepage = typeof repo.homepage === 'string' ? repo.homepage.trim() : '';

  if (rawHomepage) {
    const withProtocol = /^https?:\/\//i.test(rawHomepage)
      ? rawHomepage
      : `https://${rawHomepage}`;
    try {
      const parsed = new URL(withProtocol);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.toString();
      }
    } catch {
      // Ignore malformed homepage strings and fall through to has_pages check.
    }
  }

  if (repo.has_pages && repo.name) {
    const userHost = `${GITHUB_USERNAME.toLowerCase()}.github.io`;
    if (repo.name.toLowerCase() === userHost) {
      return `https://${userHost}/`;
    }
    return `https://${userHost}/${encodeURIComponent(repo.name)}/`;
  }

  return null;
}

/**
 * Maps a raw GitHub REST repository payload into the shape used by Card.
 */
export function normalizeRepository(repo) {
  const seen = new Set();
  const techStack = [];

  for (const item of [repo.language, ...(Array.isArray(repo.topics) ? repo.topics : [])]) {
    if (!item || typeof item !== 'string') continue;
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    techStack.push(item.trim());
    if (techStack.length >= 4) break;
  }

  return {
    id: repo.id,
    name: repo.name,
    description: repo.description?.trim() || 'Repositorio público en GitHub.',
    repoUrl: repo.html_url,
    websiteUrl: resolveWebsiteUrl(repo),
    language: repo.language || null,
    techStack,
    stars: repo.stargazers_count ?? 0,
    updatedAt: repo.updated_at || null,
  };
}

function readCachedRepos() {
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.repos) || typeof parsed.timestamp !== 'number') {
      return null;
    }
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      return null;
    }
    return parsed.repos;
  } catch {
    return null;
  }
}

function writeCachedRepos(repos) {
  try {
    window.sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), repos })
    );
  } catch {
    // Ignore storage quota or private-browsing errors.
  }
}

/**
 * Fetches public owner repositories for Azcoalt from the GitHub REST API.
 */
export async function fetchPublicRepos({ signal, forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = readCachedRepos();
    if (cached) return cached;
  }

  const response = await fetch(GITHUB_REPOS_API, {
    signal,
    headers: {
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API respondió con estado ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Formato inesperado recibido desde GitHub API');
  }

  const repos = data
    .filter((repo) => !repo.private)
    .map(normalizeRepository);

  writeCachedRepos(repos);
  return repos;
}
