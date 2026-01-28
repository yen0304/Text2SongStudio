import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

describe('AlertDialog', () => {
  it('renders trigger button', () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    );

    expect(screen.getByText('Open Dialog')).toBeInTheDocument();
  });

  it('opens dialog when trigger is clicked', async () => {
    const { user } = render(
      <AlertDialog>
        <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>Are you sure?</AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    );

    await user.click(screen.getByText('Open Dialog'));

    await waitFor(() => {
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });
  });

  it('renders action and cancel buttons', async () => {
    const { user } = render(
      <AlertDialog>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );

    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });
  });

  it('closes dialog when cancel is clicked', async () => {
    const { user } = render(
      <AlertDialog>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );

    await user.click(screen.getByText('Open'));
    await waitFor(() => expect(screen.getByText('Cancel')).toBeInTheDocument());
    
    await user.click(screen.getByText('Cancel'));
    
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  it('calls action handler when action button is clicked', async () => {
    const onAction = vi.fn();
    const { user } = render(
      <AlertDialog>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={onAction}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );

    await user.click(screen.getByText('Open'));
    await waitFor(() => expect(screen.getByText('Confirm')).toBeInTheDocument());
    
    await user.click(screen.getByText('Confirm'));
    
    expect(onAction).toHaveBeenCalled();
  });

  it('applies custom className to content', async () => {
    const { user } = render(
      <AlertDialog>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent className="custom-content">
          <AlertDialogHeader>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    );

    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toHaveClass('custom-content');
    });
  });

  it('applies custom className to header', async () => {
    const { user } = render(
      <AlertDialog>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader className="custom-header">
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    );

    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(screen.getByText('Title').parentElement).toHaveClass('custom-header');
    });
  });

  it('applies custom className to footer', async () => {
    const { user } = render(
      <AlertDialog>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="custom-footer">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );

    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(screen.getByText('Cancel').parentElement).toHaveClass('custom-footer');
    });
  });
});
