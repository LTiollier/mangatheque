<?php

namespace Tests\PHPStan;

use PhpParser\Node;
use PHPStan\Analyser\Scope;
use PHPStan\Rules\Rule;

/**
 * @implements Rule<Node\Stmt\Class_>
 */
class DomainHasTestRule implements Rule
{
    public function getNodeType(): string
    {
        return Node\Stmt\Class_::class;
    }

    public function processNode(Node $node, Scope $scope): array
    {
        if (!isset($node->namespacedName)) {
            return [];
        }

        $className = $node->namespacedName->toString();

        // Target only classes in Domain namespaces
        if (!preg_match('/^App\\\\[^\\\\]+\\\\Domain\\\\(.+)$/', $className, $matches)) {
            return [];
        }

        // We might want to skip Exceptions, Events, and interfaces (though interfaces are Interface_ node so Class_ shouldn't trigger them unless they are classes).
        // Let's exclude Exceptions and Events for this example, or include them if "chaque fichier" means literally everything.
        // Usually, exceptions don't need tests unless complex. But the user asked for every file.
        // Let's at least skip abstract classes or empty exceptions if needed, but for now we enforce it.

        $file = $scope->getFile();
        $cwd = getcwd();

        // Convert /Users/.../app/... to app/...
        $relativePath = str_contains($file, '/app/')
            ? 'app/' . explode('/app/', $file)[1]
            : $file;

        // Determine expected test path
        $testRelativePath = str_replace('app/', 'tests/Unit/', $relativePath);
        $testRelativePath = str_replace('.php', 'Test.php', $testRelativePath);

        $fullTestPath = rtrim($cwd, '/') . '/' . ltrim($testRelativePath, '/');

        if (!file_exists($fullTestPath)) {
            return [
                \PHPStan\Rules\RuleErrorBuilder::message(
                    sprintf(
                        "Architecture rule violation: The domain class '%s' does not have a corresponding test file. Expected test file: %s",
                        $className,
                        $testRelativePath
                    )
                )->build()
            ];
        }

        return [];
    }
}
