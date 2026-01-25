# Contributing to Text2Song Studio

Thank you for your interest in contributing to Text2Song Studio. This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please:

- Be respectful of differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Docker and Docker Compose (optional)
- Git

### Setting Up the Development Environment

1. Fork the repository on GitHub

2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/text2song-studio.git
   cd text2song-studio
   ```

3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/your-org/text2song-studio.git
   ```

4. **Install Git Hooks (Required):**
   ```bash
   # From the project root - this sets up Husky pre-commit and pre-push hooks
   npm install
   ```
   This ensures your commits and pushes pass the same checks as CI.

5. Set up the backend:
   ```bash
   cd backend
   uv sync --all-extras --dev
   ```

6. Set up the frontend:
   ```bash
   cd frontend
   npm install
   ```

7. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New features | `feature/add-batch-export` |
| `fix/` | Bug fixes | `fix/audio-playback-safari` |
| `docs/` | Documentation | `docs/api-examples` |
| `refactor/` | Code refactoring | `refactor/generation-service` |
| `test/` | Test updates | `test/feedback-api-tests` |
| `chore/` | Maintenance | `chore/update-dependencies` |

### Creating a Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create your branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. Make your changes in small, logical commits
2. Write clear commit messages following the convention
3. Add tests for new functionality
4. Update documentation as needed

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(generation): add multi-adapter support for inference

- Allow selecting multiple LoRA adapters
- Implement adapter weight blending
- Add UI controls for adapter selection

Closes #42
```

```
fix(audio): resolve playback issue on Safari

Safari requires user interaction before audio playback.
Added click-to-play handler for initial playback.

Fixes #78
```

## Pull Request Process

### Before Submitting

1. **Sync with upstream:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests:**
   ```bash
   # Backend
   cd backend && pytest
   
   # Frontend
   cd frontend && npm run test
   ```

3. **Run linters:**
   ```bash
   # Backend
   cd backend && black . && ruff check .
   
   # Frontend
   cd frontend && npm run lint
   ```

4. **Update documentation** if you changed APIs or added features

### Submitting a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a Pull Request on GitHub

3. Fill out the PR template completely

4. Request review from maintainers

### PR Template

```markdown
## Description

[Describe the changes and motivation]

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that changes existing functionality)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)

## Related Issues

Fixes #[issue number]

## How Has This Been Tested?

[Describe the tests you ran]

## Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or my feature works
- [ ] New and existing unit tests pass locally with my changes

## Screenshots (if applicable)

[Add screenshots for UI changes]
```

### Review Process

- At least one maintainer approval is required
- All CI checks must pass
- Address all review comments
- Squash commits if requested

## Code Style

### Python (Backend)

- Follow PEP 8
- Use type hints
- Maximum line length: 88 characters (Black default)
- Use docstrings for public functions and classes

```python
def generate_audio(
    prompt: str,
    duration: float = 10.0,
    adapter_id: str | None = None,
) -> AudioResult:
    """Generate audio from a text prompt.

    Args:
        prompt: Text description of the desired audio.
        duration: Length of audio in seconds.
        adapter_id: Optional LoRA adapter to apply.

    Returns:
        AudioResult containing the generated audio data.

    Raises:
        GenerationError: If audio generation fails.
    """
    ...
```

**Tools:**
- Formatter: `black`
- Linter: `ruff`
- Type checker: `mypy`

### TypeScript (Frontend)

- Use TypeScript strict mode
- Prefer functional components with hooks
- Use explicit return types for functions

```typescript
interface AudioPlayerProps {
  audioUrl: string;
  onPlaybackEnd?: () => void;
}

export function AudioPlayer({ 
  audioUrl, 
  onPlaybackEnd 
}: AudioPlayerProps): JSX.Element {
  // ...
}
```

**Tools:**
- Formatter: `prettier`
- Linter: `eslint`

## Testing

### Backend Testing

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_generation.py

# Run tests matching a pattern
pytest -k "test_audio"
```

**Test structure:**
```
backend/
└── tests/
    ├── conftest.py          # Shared fixtures
    ├── test_generation.py   # Generation service tests
    ├── test_feedback.py     # Feedback API tests
    └── test_datasets.py     # Dataset service tests
```

### Frontend Testing

```bash
cd frontend

# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Writing Tests

- Test one thing per test function
- Use descriptive test names
- Include both positive and negative cases
- Mock external dependencies

```python
# Backend example
def test_generate_audio_with_valid_prompt(mock_model):
    """Test that valid prompts produce audio output."""
    result = generate_audio("upbeat electronic music")
    assert result.audio_data is not None
    assert result.duration > 0

def test_generate_audio_with_empty_prompt_raises_error():
    """Test that empty prompts raise ValidationError."""
    with pytest.raises(ValidationError):
        generate_audio("")
```

## Documentation

### Code Documentation

- Add docstrings to all public functions, classes, and modules
- Include type hints in function signatures
- Document complex algorithms with inline comments

### API Documentation

- FastAPI automatically generates OpenAPI docs
- Add descriptions to endpoints and parameters
- Include request/response examples

```python
@router.post("/generation", response_model=GenerationResponse)
async def create_generation(
    request: GenerationRequest,
) -> GenerationResponse:
    """Generate audio from a text prompt.

    - **prompt**: Text description of desired music
    - **duration**: Length in seconds (5-30)
    - **adapter_id**: Optional LoRA adapter ID
    """
    ...
```

### User Documentation

- Update README.md for user-facing changes
- Add examples for new features
- Keep the FAQ section updated

## Questions?

If you have questions about contributing:

1. Check existing issues and discussions
2. Open a new discussion on GitHub
3. Ask in the relevant issue thread

Thank you for contributing to Text2Song Studio!
