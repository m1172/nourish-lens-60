import { BookOpen, Home, LineChart, Plus } from 'lucide-react';
import { NavLink } from '@/components/navigation/NavLink';

export default function BottomNav() {
  const linkClass =
    'flex flex-col items-center justify-center py-2 text-muted-foreground transition-colors';
  const activeClass = 'text-primary';

  return (
    <nav className='fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom z-50'>
      <div className='max-w-screen-sm mx-auto flex items-center justify-around h-16 px-4'>
        <NavLink to='/' className={linkClass} activeClassName={activeClass}>
          <Home className='h-6 w-6' />
          <span className='text-xs mt-1'>Diary</span>
        </NavLink>

        <NavLink
          to='/recipes'
          className={linkClass}
          activeClassName={activeClass}
        >
          <BookOpen className='h-6 w-6' />
          <span className='text-xs mt-1'>Recipes</span>
        </NavLink>

        <NavLink to='/add' className={linkClass} activeClassName={activeClass}>
          <div className='flex flex-col items-center -mt-6'>
            <div className='bg-primary text-primary-foreground rounded-full p-3 shadow-lg'>
              <Plus className='h-6 w-6' />
            </div>
            <span className='text-xs mt-1'>Add</span>
          </div>
        </NavLink>

        <NavLink
          to='/progress'
          className={linkClass}
          activeClassName={activeClass}
        >
          <LineChart className='h-6 w-6' />
          <span className='text-xs mt-1'>Progress</span>
        </NavLink>

        <NavLink
          to='/settings'
          className={linkClass}
          activeClassName={activeClass}
        >
          <div className='h-6 w-6 rounded-full bg-muted flex items-center justify-center'>
            <span className='text-sm font-semibold'>Me</span>
          </div>
          <span className='text-xs mt-1'>Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
