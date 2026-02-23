<?php

namespace Tests\PHPStan;

use PhpParser\Node;
use PHPStan\Analyser\Scope;
use PHPStan\Rules\Rule;

/**
 * @implements Rule<Node\Stmt\Class_>
 */
class ActionHasTestRule implements Rule
{
    public function getNodeType(): string
    {
        return Node\Stmt\Class_::class;
    }

    public function processNode(Node $node, Scope $scope): array
    {
        if (! isset($node->namespacedName)) {
            return [];
        }

        $className = $node->namespacedName->toString();

        // Target only classes in Application\Actions namespaces
        if (! preg_match('/^App\\\\[^\\\\]+\\\\Application\\\\Actions\\\\(.+)$/', $className, $matches)) {
            return [];
        }

        $file = $scope->getFile();
        $cwd = getcwd() ?: '';

        // Convert /Users/.../app/... to app/...
        $relativePath = str_contains($file, '/app/')
            ? 'app/'.explode('/app/', $file)[1]
            : $file;

        // Determine expected test path
        $testRelativePath = str_replace('app/', 'tests/Unit/', $relativePath);
        $testRelativePath = str_replace('.php', 'Test.php', $testRelativePath);

        $fullTestPath = rtrim($cwd, '/').'/'.ltrim($testRelativePath, '/');

        if (! file_exists($fullTestPath)) {
            return [
                \PHPStan\Rules\RuleErrorBuilder::message(
                    sprintf(
                        "Architecture rule violation: The action class '%s' does not have a corresponding test file. Expected test file: %s",
                        $className,
                        $testRelativePath
                    )
                )
                    ->identifier('architecture.missingActionTest')
                    ->build(),
            ];
        }

        return [];
    }
}
