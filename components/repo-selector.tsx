'use client'
import { createProject } from '@/actions/projects';
import { useState } from 'react';
import { FaGithub } from 'react-icons/fa'

const RepoSelector = ({ repos }: { repos: GithubProjects[] }) => {
    const [selectedRepo, setSelectedRepo] = useState<GithubProjects | null>(null);
    const [subdomain, setSubdomain] = useState<string>('');
    return (
        <div>
            <div className='mx-auto px-6 lg:px-40 w-full'>
                <p className='text-2xl' >Your Repositories</p>
                <div className='flex mt-3'>
                    <div className='max-w-xs w-full mt-3'>
                        {repos.slice(0, 6).map((repo: GithubProjects) =>
                        (
                            <div key={repo.url} onClick={() => {setSelectedRepo(repo); setSubdomain(repo.name)}} className={`${selectedRepo?.url === repo.url ? 'bg-neutral-200' : 'bg-neutral-50'} py-2 w-full border-y border-neutral-200/60 px-5`}>

                                <h1 className='flex items-center gap-1 text-xl tracking-wide'><FaGithub /> {repo.name}</h1>
                                <a href={repo.url} target="_blank" rel="noopener noreferrer" className='text-xs tracking-wider text-neutral-400'>{repo.url}</a>
                            </div>

                        )
                        )}
                    </div>
                    <div className='mt-3  w-full px-5 py-3'>
                        <form className=' flex flex-col gap-4 max-w-xl' action={createProject}>
                            {/* <h1 className='text-xl font-bold'>Deploy Your Project</h1> */}
                            <div className='flex flex-col gap-1'>
                                <label htmlFor="githubUrl" className='text-sm text-neutral-800'>GitHub URL</label>
                                <input type="text" placeholder="GitHub URL" value={selectedRepo?.url || ''} name="githubUrl" className='border px-2 py-0.5 border-neutral-200 bg-neutral-100 text-neutral-400' readOnly/>
                            </div>

                            <div className='flex flex-col gap-1'> 
                                <label htmlFor="subdomain" className='text-sm text-neutral-800'>Subdomain</label>
                                <input type="text" placeholder="Subdomain" name="subdomain" className='border px-2 py-0.5 border-neutral-200 ' value={subdomain} onChange={(e) => setSubdomain(e.target.value)} />
                                <p className='text-xs text-neutral-400'>Your app will run at <span className='text-neutral-600 tracking-wide'>{subdomain}.app.sakshamjain.dev</span></p>
                            </div>
                            <div className='flex flex-col gap-1'> 
                                <label htmlFor="env" className='text-sm text-neutral-800'>Environment Variables</label>
                                <textarea placeholder="DATABASE_URL=... " name="env" className='border text-xs text-neutral-600 px-2 py-0.5 border-neutral-200 modern font-mono '/>
                            </div>

                            <button type="submit" className='bg-neutral-900 w-[120px] text-white rounded-md hover:bg-neutral-800 py-0.5 tracking-wide'>Deploy</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>

    )
}

export default RepoSelector