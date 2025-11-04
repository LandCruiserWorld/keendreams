/**
 * Project Location & Deployment Tracker
 * Enhances KeenDreams with project location and deployment status tracking
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class ProjectLocationTracker {
    constructor(workerUrl, apiKey) {
        this.workerUrl = workerUrl;
        this.apiKey = apiKey;
        this.projectLocations = new Map();
    }

    // Scan and categorize project by location and deployment status
    async analyzeProjectLocation(projectPath, projectName) {
        const analysis = {
            projectName,
            projectPath,
            location: await this.detectProjectLocation(projectPath),
            deploymentStatus: await this.detectDeploymentStatus(projectPath),
            urls: await this.extractProjectUrls(projectPath),
            repositoryInfo: await this.getRepositoryInfo(projectPath),
            lastAnalysis: new Date().toISOString()
        };

        return analysis;
    }

    async detectProjectLocation(projectPath) {
        const location = {
            type: 'unknown',
            isLocal: false,
            hasRemoteRepo: false,
            isDeployed: false
        };

        try {
            // Check if it's a git repository
            await execAsync('git status', { cwd: projectPath });
            
            // Check for remote repositories
            try {
                const { stdout: remotes } = await execAsync('git remote -v', { cwd: projectPath });
                if (remotes.trim()) {
                    location.hasRemoteRepo = true;
                    location.type = 'git-tracked';
                    
                    // Determine hosting platform
                    if (remotes.includes('github.com')) {
                        location.platform = 'github';
                    } else if (remotes.includes('gitlab.com')) {
                        location.platform = 'gitlab';
                    } else if (remotes.includes('bitbucket.org')) {
                        location.platform = 'bitbucket';
                    }
                } else {
                    location.type = 'local-git';
                    location.isLocal = true;
                }
            } catch (error) {
                location.type = 'local-git';
                location.isLocal = true;
            }
        } catch (error) {
            // Not a git repository
            location.type = 'local-folder';
            location.isLocal = true;
        }

        return location;
    }

    async detectDeploymentStatus(projectPath) {
        const deployment = {
            status: 'not-deployed',
            platforms: [],
            configurations: [],
            urls: {
                dev: null,
                staging: null,
                production: null
            }
        };

        const configFiles = [
            { file: 'wrangler.toml', platform: 'cloudflare-workers' },
            { file: 'vercel.json', platform: 'vercel' },
            { file: 'netlify.toml', platform: 'netlify' },
            { file: '.platform.app.yaml', platform: 'platform.sh' },
            { file: 'Dockerfile', platform: 'docker' },
            { file: 'docker-compose.yml', platform: 'docker-compose' },
            { file: 'fly.toml', platform: 'fly.io' },
            { file: 'railway.toml', platform: 'railway' }
        ];

        for (const { file, platform } of configFiles) {
            const configPath = path.join(projectPath, file);
            if (fs.existsSync(configPath)) {
                deployment.platforms.push(platform);
                deployment.configurations.push({
                    platform,
                    configFile: file,
                    exists: true
                });

                // Extract deployment URLs from config files
                try {
                    const content = fs.readFileSync(configPath, 'utf8');
                    deployment.urls = {
                        ...deployment.urls,
                        ...await this.extractUrlsFromConfig(content, platform)
                    };
                } catch (error) {
                    console.warn(`Could not read ${file}:`, error.message);
                }
            }
        }

        // Check package.json for deployment scripts
        const packageJsonPath = path.join(projectPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                if (packageJson.scripts) {
                    const deployScripts = Object.keys(packageJson.scripts)
                        .filter(script => script.includes('deploy') || script.includes('build'));
                    
                    if (deployScripts.length > 0) {
                        deployment.configurations.push({
                            platform: 'npm-scripts',
                            deployScripts,
                            exists: true
                        });
                    }
                }
            } catch (error) {
                console.warn('Could not parse package.json:', error.message);
            }
        }

        deployment.status = deployment.platforms.length > 0 ? 'configured' : 'not-deployed';

        return deployment;
    }

    async extractProjectUrls(projectPath) {
        const urls = {
            development: null,
            staging: null,
            production: null,
            repository: null,
            documentation: null
        };

        try {
            // Get repository URL
            const { stdout: remoteUrl } = await execAsync('git remote get-url origin', { cwd: projectPath });
            if (remoteUrl.trim()) {
                urls.repository = remoteUrl.trim();
            }
        } catch (error) {
            // No remote or not a git repo
        }

        // Check README files for URLs
        const readmeFiles = ['README.md', 'README.txt', 'readme.md'];
        for (const readmeFile of readmeFiles) {
            const readmePath = path.join(projectPath, readmeFile);
            if (fs.existsSync(readmePath)) {
                try {
                    const content = fs.readFileSync(readmePath, 'utf8');
                    const extractedUrls = this.extractUrlsFromText(content);
                    Object.assign(urls, extractedUrls);
                } catch (error) {
                    // Continue to next file
                }
                break; // Use first README found
            }
        }

        // Check for common deployment URL patterns in config files
        const configFiles = ['wrangler.toml', 'vercel.json', 'netlify.toml'];
        for (const configFile of configFiles) {
            const configPath = path.join(projectPath, configFile);
            if (fs.existsSync(configPath)) {
                try {
                    const content = fs.readFileSync(configPath, 'utf8');
                    const configUrls = await this.extractUrlsFromConfig(content, configFile.split('.')[0]);
                    Object.assign(urls, configUrls);
                } catch (error) {
                    // Continue to next file
                }
            }
        }

        return urls;
    }

    extractUrlsFromText(text) {
        const urls = {};
        
        // Common URL patterns
        const urlPatterns = [
            { pattern: /https?:\/\/[^\s]+\.vercel\.app/gi, type: 'production' },
            { pattern: /https?:\/\/[^\s]+\.workers\.dev/gi, type: 'production' },
            { pattern: /https?:\/\/[^\s]+\.netlify\.app/gi, type: 'production' },
            { pattern: /https?:\/\/localhost:\d+/gi, type: 'development' },
            { pattern: /https?:\/\/127\.0\.0\.1:\d+/gi, type: 'development' },
            { pattern: /https?:\/\/[^\s]+\.herokuapp\.com/gi, type: 'production' },
            { pattern: /https?:\/\/[^\s]+\.railway\.app/gi, type: 'production' },
            { pattern: /https?:\/\/[^\s]+\.fly\.dev/gi, type: 'production' }
        ];

        for (const { pattern, type } of urlPatterns) {
            const matches = text.match(pattern);
            if (matches && !urls[type]) {
                urls[type] = matches[0];
            }
        }

        return urls;
    }

    async extractUrlsFromConfig(content, platform) {
        const urls = {};

        switch (platform) {
            case 'wrangler':
                // Cloudflare Workers
                const nameMatch = content.match(/name\s*=\s*["']([^"']+)["']/);
                if (nameMatch) {
                    urls.production = `https://${nameMatch[1]}.workers.dev`;
                }
                break;
                
            case 'vercel':
                try {
                    const config = JSON.parse(content);
                    if (config.name) {
                        urls.production = `https://${config.name}.vercel.app`;
                    }
                } catch (e) {
                    // Invalid JSON
                }
                break;
                
            case 'netlify':
                // Netlify configuration
                const siteMatch = content.match(/site_id\s*=\s*["']([^"']+)["']/);
                if (siteMatch) {
                    // Would need actual site name, not just ID
                    urls.production = `https://${siteMatch[1]}.netlify.app`;
                }
                break;
        }

        return urls;
    }

    async getRepositoryInfo(projectPath) {
        const repoInfo = {
            hasRepo: false,
            platform: null,
            url: null,
            isPublic: null,
            lastCommit: null,
            branch: null
        };

        try {
            // Check if it's a git repository
            await execAsync('git status', { cwd: projectPath });
            repoInfo.hasRepo = true;

            // Get remote URL
            try {
                const { stdout: remoteUrl } = await execAsync('git remote get-url origin', { cwd: projectPath });
                repoInfo.url = remoteUrl.trim();
                
                // Determine platform
                if (repoInfo.url.includes('github.com')) {
                    repoInfo.platform = 'github';
                } else if (repoInfo.url.includes('gitlab.com')) {
                    repoInfo.platform = 'gitlab';
                } else if (repoInfo.url.includes('bitbucket.org')) {
                    repoInfo.platform = 'bitbucket';
                }
            } catch (e) {
                // No remote
            }

            // Get current branch
            try {
                const { stdout: branch } = await execAsync('git branch --show-current', { cwd: projectPath });
                repoInfo.branch = branch.trim();
            } catch (e) {
                repoInfo.branch = 'main';
            }

            // Get last commit
            try {
                const { stdout: lastCommit } = await execAsync('git log -1 --pretty=format:"%h - %s (%cr)"', { cwd: projectPath });
                repoInfo.lastCommit = lastCommit.trim();
            } catch (e) {
                // No commits
            }

        } catch (error) {
            // Not a git repository
        }

        return repoInfo;
    }

    // Generate comprehensive project location report
    async generateProjectLocationReport(projects) {
        const report = {
            timestamp: new Date().toISOString(),
            totalProjects: projects.length,
            summary: {
                localOnly: 0,
                hasRemoteRepo: 0,
                deployed: 0,
                configured: 0
            },
            platforms: {},
            projects: []
        };

        for (const projectName of projects) {
            try {
                // This would need actual project paths - might need to scan file system
                const analysis = await this.analyzeProjectLocation('.', projectName);
                report.projects.push(analysis);
                
                // Update summary
                if (analysis.location.isLocal) report.summary.localOnly++;
                if (analysis.location.hasRemoteRepo) report.summary.hasRemoteRepo++;
                if (analysis.deploymentStatus.status !== 'not-deployed') report.summary.configured++;
                
                // Track platforms
                analysis.deploymentStatus.platforms.forEach(platform => {
                    report.platforms[platform] = (report.platforms[platform] || 0) + 1;
                });
                
            } catch (error) {
                console.warn(`Could not analyze ${projectName}:`, error.message);
            }
        }

        return report;
    }
}

// CLI interface
if (require.main === module) {
    const tracker = new ProjectLocationTracker(
        process.env.KEENDREAMS_URL || 'https://keendreams.workers.dev',
        process.env.KEENDREAMS_API_KEY
    );

    const command = process.argv[2];
    const projectPath = process.argv[3] || '.';

    switch (command) {
        case 'analyze':
            const projectName = path.basename(projectPath);
            tracker.analyzeProjectLocation(projectPath, projectName).then(analysis => {
                console.log(JSON.stringify(analysis, null, 2));
            });
            break;
            
        case 'urls':
            tracker.extractProjectUrls(projectPath).then(urls => {
                console.log('Project URLs:');
                Object.entries(urls).forEach(([type, url]) => {
                    if (url) console.log(`  ${type}: ${url}`);
                });
            });
            break;
            
        default:
            console.log('Project Location Tracker');
            console.log('\nCommands:');
            console.log('  analyze [path]  - Analyze project location and deployment');
            console.log('  urls [path]     - Extract project URLs');
            break;
    }
}

module.exports = { ProjectLocationTracker };